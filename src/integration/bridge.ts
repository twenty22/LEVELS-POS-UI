import type { DeviceCapabilities, PaymentResult, StartPaymentRequest } from './contracts'

export type CloverFlexBridge = {
  getDeviceCapabilities: () => Promise<DeviceCapabilities>
  startPayment: (request: StartPaymentRequest) => Promise<PaymentResult>
}

declare global {
  interface Window {
    CloverFlexBridge?: CloverFlexBridge
  }
}

export const getCloverFlexBridge = (): CloverFlexBridge | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.CloverFlexBridge ?? null
}
