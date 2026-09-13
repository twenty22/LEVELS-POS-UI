import { getCloverFlexBridge } from './bridge'
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
import { createHttpPosClient } from './http-client'
import { createMockPosClient } from './mock-client'
import type { PosRuntimeConfig } from './runtime-config'

export type PosClient = {
  getBootstrap: () => Promise<BootstrapPayload>
  upsertOrder: (request: UpsertOrderRequest) => Promise<UpsertOrderResponse>
  startPayment: (request: StartPaymentRequest) => Promise<PaymentResult>
  finalizeOrder: (request: FinalizeOrderRequest) => Promise<FinalizeOrderResponse>
}

const computeRuntimeMode = (mockMode: boolean): BootstrapPayload['runtimeMode'] => {
  if (mockMode) {
    return 'mock'
  }

  return getCloverFlexBridge() ? 'bridge' : 'api'
}

export const createPosClient = (config: PosRuntimeConfig): PosClient => {
  const dataClient: PosDataClient = config.mockMode
    ? createMockPosClient()
    : createHttpPosClient(config.bffBaseUrl)

  return {
    async getBootstrap(): Promise<BootstrapPayload> {
      const bootstrap = await dataClient.getBootstrap()
      const bridge = getCloverFlexBridge()

      if (!bridge) {
        return { ...bootstrap, runtimeMode: computeRuntimeMode(config.mockMode) }
      }

      const deviceCapabilities = await bridge.getDeviceCapabilities()
      return {
        ...bootstrap,
        device: deviceCapabilities,
        runtimeMode: computeRuntimeMode(config.mockMode),
      }
    },

    async upsertOrder(request: UpsertOrderRequest): Promise<UpsertOrderResponse> {
      return dataClient.upsertOrder(request)
    },

    async startPayment(request: StartPaymentRequest): Promise<PaymentResult> {
      const bridge = getCloverFlexBridge()
      if (!bridge) {
        return dataClient.startPayment(request)
      }

      return bridge.startPayment(request)
    },

    async finalizeOrder(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
      return dataClient.finalizeOrder(request)
    },
  }
}
