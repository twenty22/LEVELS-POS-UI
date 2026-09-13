import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'

const MAX_BODY_BYTES = 1_000_000

const catalog = [
  { id: 'cruzan-confusion', name: 'Cruzan Confusion', section: 'Drinks', priceCents: 1500 },
  { id: 'painkiller', name: 'St. Croix Painkiller', section: 'Drinks', priceCents: 1500 },
  { id: 'bushwacker', name: 'Boardwalk Bushwacker', section: 'Drinks', priceCents: 1500 },
  { id: 'rum-punch', name: 'House Rum Punch', section: 'Drinks', priceCents: 1500 },
  { id: 'soursop-spritz', name: 'Soursop Lime Spritz', section: 'Drinks', priceCents: 1500 },
  { id: 'island-haze-1g', name: 'Island Haze', section: 'Dispensary', size: '1g', priceCents: 1800 },
  { id: 'island-haze-35g', name: 'Island Haze', section: 'Dispensary', size: '3.5g', priceCents: 5200 },
  { id: 'sunset-sherbet-1g', name: 'Sunset Sherbet', section: 'Dispensary', size: '1g', priceCents: 2000 },
  { id: 'sunset-sherbet-35g', name: 'Sunset Sherbet', section: 'Dispensary', size: '3.5g', priceCents: 5600 },
  { id: 'christiansted-kush-1g', name: 'Christiansted Kush', section: 'Dispensary', size: '1g', priceCents: 1900 },
  { id: 'christiansted-kush-35g', name: 'Christiansted Kush', section: 'Dispensary', size: '3.5g', priceCents: 5400 },
]

const employees = [
  { id: 'bartender-a', name: 'Bartender A' },
  { id: 'bartender-b', name: 'Bartender B' },
  { id: 'bartender-c', name: 'Bartender C' },
  { id: 'bartender-d', name: 'Bartender D' },
]

const tenders = [
  { id: 'tap', label: 'Tap', detail: 'Fastest card flow' },
  { id: 'chip', label: 'Chip', detail: 'Fallback ready' },
  { id: 'cash', label: 'Cash', detail: 'Drawer A' },
  { id: 'gift', label: 'Gift', detail: 'Scan or key in' },
]

const itemById = new Map(catalog.map((item) => [item.id, item]))
const orders = new Map()

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const parseBoolean = (value, fallback) => {
  if (value === undefined) {
    return fallback
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error(`Invalid boolean value "${value}"`)
}

const parsePort = (value) => {
  const port = Number.parseInt(value, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid LEVELS_BFF_PORT "${value}"`)
  }

  return port
}

const loadConfig = () => {
  const mockMode = parseBoolean(process.env.LEVELS_BFF_MOCK_MODE, true)
  const port = parsePort(process.env.LEVELS_BFF_PORT ?? '8787')
  const host = process.env.LEVELS_BFF_HOST ?? '127.0.0.1'
  const merchantId = process.env.CLOVER_MERCHANT_ID ?? 'LEVELS-DEMO-MERCHANT'
  const merchantName = process.env.LEVELS_MERCHANT_NAME ?? 'LEVELS VI'
  const cloverEnvironment = process.env.CLOVER_ENVIRONMENT ?? 'sandbox'

  if (!['sandbox', 'production'].includes(cloverEnvironment)) {
    throw new Error(`Invalid CLOVER_ENVIRONMENT "${cloverEnvironment}"`)
  }

  if (!mockMode) {
    if (!process.env.CLOVER_ACCESS_TOKEN) {
      throw new Error('CLOVER_ACCESS_TOKEN is required when LEVELS_BFF_MOCK_MODE=false')
    }

    if (!process.env.CLOVER_MERCHANT_ID) {
      throw new Error('CLOVER_MERCHANT_ID is required when LEVELS_BFF_MOCK_MODE=false')
    }
  }

  return { mockMode, port, host, merchantId, merchantName, cloverEnvironment }
}

const json = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  response.end(JSON.stringify(payload))
}

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let raw = ''

    request.on('data', (chunk) => {
      raw += chunk
      if (raw.length > MAX_BODY_BYTES) {
        reject(new HttpError(413, `Request body exceeded ${MAX_BODY_BYTES} bytes`))
        request.destroy()
      }
    })

    request.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'invalid JSON body'
        reject(new HttpError(400, `Invalid JSON body: ${message}`))
      }
    })

    request.on('error', (error) => {
      reject(new HttpError(400, `Failed to read request body: ${error.message}`))
    })
  })

const requireMockMode = (config) => {
  if (!config.mockMode) {
    throw new HttpError(
      501,
      'Live Clover proxy methods are intentionally not implemented in this scaffold. Use mock mode or add Clover REST integrations.',
    )
  }
}

const assertOrderLines = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new HttpError(400, 'Payload must include a non-empty "lines" array')
  }

  for (const line of lines) {
    if (!line || typeof line.itemId !== 'string' || line.itemId.length === 0) {
      throw new HttpError(400, 'Each line must include a valid "itemId" string')
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new HttpError(400, `Line "${line.itemId}" has invalid quantity "${line.quantity}"`)
    }

    if (!itemById.has(line.itemId)) {
      throw new HttpError(400, `Unknown catalog item "${line.itemId}"`)
    }
  }
}

const calculateTotalCents = (lines) =>
  lines.reduce((sum, line) => {
    const item = itemById.get(line.itemId)
    if (!item) {
      throw new HttpError(400, `Unknown catalog item "${line.itemId}"`)
    }

    return sum + item.priceCents * line.quantity
  }, 0)

const buildBootstrapPayload = (config) => ({
  merchant: {
    merchantId: config.merchantId,
    displayName: config.merchantName,
    taxMode: 'none',
  },
  catalog,
  employees,
  tenders,
  device: {
    model: 'C403',
    productName: 'Clover Flex 4',
    serial: 'BFF-SCAFFOLD-DEMO',
    securePayments: true,
    secureTouch: true,
    bundledPrinter: true,
    customerMode: true,
    customerRotation: true,
    merchantOnly: false,
    paymentOnly: false,
  },
  runtimeMode: 'api',
})

const handleOrderUpsert = (payload) => {
  if (!payload || typeof payload.employeeId !== 'string' || payload.employeeId.length === 0) {
    throw new HttpError(400, 'Payload must include "employeeId"')
  }

  assertOrderLines(payload.lines)
  const totalCents = calculateTotalCents(payload.lines)
  const orderId = payload.orderId ?? `BFF-ORDER-${randomUUID()}`
  const lineCount = payload.lines.reduce((sum, line) => sum + line.quantity, 0)

  orders.set(orderId, {
    orderId,
    employeeId: payload.employeeId,
    lines: payload.lines,
    totalCents,
    lineCount,
    updatedAt: new Date().toISOString(),
  })

  return { orderId, totalCents, currency: 'USD', lineCount }
}

const handlePaymentStart = (payload) => {
  if (!payload || typeof payload.orderId !== 'string' || payload.orderId.length === 0) {
    throw new HttpError(400, 'Payload must include "orderId"')
  }

  if (!Number.isInteger(payload.amountCents) || payload.amountCents <= 0) {
    throw new HttpError(400, 'Payload must include a positive integer "amountCents"')
  }

  const order = orders.get(payload.orderId)
  if (!order) {
    throw new HttpError(404, `Order "${payload.orderId}" does not exist`)
  }

  if (order.totalCents !== payload.amountCents) {
    throw new HttpError(
      409,
      `Order amount mismatch for "${payload.orderId}" (expected ${order.totalCents}, got ${payload.amountCents})`,
    )
  }

  return {
    status: 'success',
    paymentId: `BFF-PAY-${randomUUID()}`,
    message: `Scaffold payment approved with tender "${payload.tenderId ?? 'unknown'}"`,
  }
}

const handleOrderFinalize = (payload) => {
  if (!payload || typeof payload.orderId !== 'string' || payload.orderId.length === 0) {
    throw new HttpError(400, 'Payload must include "orderId"')
  }

  if (!orders.has(payload.orderId)) {
    throw new HttpError(404, `Order "${payload.orderId}" does not exist`)
  }

  orders.delete(payload.orderId)
  return {
    orderId: payload.orderId,
    status: 'closed',
    closedAt: new Date().toISOString(),
  }
}

const config = loadConfig()

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    })
    response.end()
    return
  }

  try {
    if (request.method === 'GET' && requestUrl.pathname === '/health') {
      json(response, 200, {
        status: 'ok',
        mode: config.mockMode ? 'mock' : 'live',
        environment: config.cloverEnvironment,
        timestamp: new Date().toISOString(),
      })
      return
    }

    if (request.method === 'GET' && requestUrl.pathname === '/api/bootstrap') {
      json(response, 200, buildBootstrapPayload(config))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/orders/upsert') {
      requireMockMode(config)
      const payload = await readJsonBody(request)
      json(response, 200, handleOrderUpsert(payload))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/payments/start') {
      requireMockMode(config)
      const payload = await readJsonBody(request)
      json(response, 200, handlePaymentStart(payload))
      return
    }

    if (request.method === 'POST' && requestUrl.pathname === '/api/orders/finalize') {
      requireMockMode(config)
      const payload = await readJsonBody(request)
      json(response, 200, handleOrderFinalize(payload))
      return
    }

    json(response, 404, {
      error: `No route for ${request.method ?? 'UNKNOWN'} ${requestUrl.pathname}`,
    })
  } catch (error) {
    if (error instanceof HttpError) {
      json(response, error.status, { error: error.message })
      return
    }

    const message = error instanceof Error ? error.message : 'Unknown server failure'
    json(response, 500, { error: message })
  }
})

server.listen(config.port, config.host, () => {
  console.log(
    `[levels-bff] listening on http://${config.host}:${config.port} (mode=${config.mockMode ? 'mock' : 'live'})`,
  )
})
