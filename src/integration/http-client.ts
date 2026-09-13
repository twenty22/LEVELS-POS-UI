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

const parseJsonBody = async <T>(response: Response): Promise<T> => {
  const text = await response.text()
  if (text.length === 0) {
    throw new Error(`Expected JSON from ${response.url}, but response body was empty`)
  }

  try {
    return JSON.parse(text) as T
  } catch (error) {
    const parseMessage = error instanceof Error ? error.message : 'unknown JSON parse error'
    throw new Error(`Invalid JSON from ${response.url}: ${parseMessage}`)
  }
}

const requestJson = async <T>(url: string, init: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(
      `BFF request failed (${response.status} ${response.statusText}) for ${url}: ${
        bodyText || 'no response body'
      }`,
    )
  }

  return parseJsonBody<T>(response)
}

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '')

export const createHttpPosClient = (baseUrl: string): PosDataClient => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  return {
    async getBootstrap(): Promise<BootstrapPayload> {
      return requestJson<BootstrapPayload>(`${normalizedBaseUrl}/api/bootstrap`, {
        method: 'GET',
      })
    },

    async upsertOrder(request: UpsertOrderRequest): Promise<UpsertOrderResponse> {
      return requestJson<UpsertOrderResponse>(`${normalizedBaseUrl}/api/orders/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    },

    async startPayment(request: StartPaymentRequest): Promise<PaymentResult> {
      return requestJson<PaymentResult>(`${normalizedBaseUrl}/api/payments/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    },

    async finalizeOrder(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
      return requestJson<FinalizeOrderResponse>(`${normalizedBaseUrl}/api/orders/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    },
  }
}
