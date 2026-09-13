import type {
  BootstrapPayload,
  FinalizeOrderRequest,
  FinalizeOrderResponse,
  PaymentResult,
  PosDataClient,
  StartPaymentRequest,
  UpsertOrderRequest,
  UpsertOrderResponse,
} from './contracts'
import { mockCatalog, mockDeviceCapabilities, mockEmployees, mockMerchant, mockTenders } from './mock-data'

type MockOrderRecord = {
  orderId: string
  employeeId: string
  totalCents: number
}

const itemById = new Map(mockCatalog.map((item) => [item.id, item]))
const inMemoryOrders = new Map<string, MockOrderRecord>()
let orderCounter = 1050

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })

const calculateTotalCents = (request: UpsertOrderRequest): number =>
  request.lines.reduce((sum, line) => {
    const item = itemById.get(line.itemId)
    if (!item) {
      throw new Error(`Unknown item ID "${line.itemId}" in checkout payload`)
    }

    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error(`Line "${line.itemId}" has invalid quantity "${line.quantity}"`)
    }

    return sum + item.priceCents * line.quantity
  }, 0)

export const createMockPosClient = (): PosDataClient => ({
  async getBootstrap(): Promise<BootstrapPayload> {
    await wait(110)
    return {
      merchant: mockMerchant,
      catalog: [...mockCatalog],
      employees: [...mockEmployees],
      tenders: [...mockTenders],
      device: mockDeviceCapabilities,
      runtimeMode: 'mock',
    }
  },

  async upsertOrder(request: UpsertOrderRequest): Promise<UpsertOrderResponse> {
    if (request.lines.length === 0) {
      throw new Error('Cannot create a Clover order without at least one line item')
    }

    const totalCents = calculateTotalCents(request)
    const orderId = request.orderId ?? `MOCK-ORDER-${++orderCounter}`
    inMemoryOrders.set(orderId, { orderId, employeeId: request.employeeId, totalCents })
    await wait(90)

    return {
      orderId,
      totalCents,
      currency: 'USD',
      lineCount: request.lines.reduce((sum, line) => sum + line.quantity, 0),
    }
  },

  async startPayment(request: StartPaymentRequest): Promise<PaymentResult> {
    const order = inMemoryOrders.get(request.orderId)
    if (!order) {
      throw new Error(`Order "${request.orderId}" was not found in checkout session`)
    }

    if (order.totalCents !== request.amountCents) {
      throw new Error(
        `Order total mismatch for "${request.orderId}" (expected ${order.totalCents}, got ${request.amountCents})`,
      )
    }

    await wait(240)
    return {
      status: 'success',
      paymentId: `MOCK-PAY-${Date.now()}`,
      message: `Mock Clover ${request.tenderId} payment approved`,
    }
  },

  async finalizeOrder(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
    if (!inMemoryOrders.has(request.orderId)) {
      throw new Error(`Order "${request.orderId}" cannot be finalized because it does not exist`)
    }

    inMemoryOrders.delete(request.orderId)
    await wait(80)
    return {
      orderId: request.orderId,
      status: 'closed',
      closedAt: new Date().toISOString(),
    }
  },
})
