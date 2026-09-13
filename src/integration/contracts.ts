export type MenuSection = 'Drinks' | 'Dispensary'
export type ProductSize = '1g' | '3.5g'
export type TaxMode = 'none' | 'configured'
export type RuntimeMode = 'mock' | 'api' | 'bridge'
export type PaymentStatus = 'success' | 'partial' | 'canceled' | 'failed' | 'offline'

export type CatalogItem = {
  id: string
  name: string
  section: MenuSection
  priceCents: number
  size?: ProductSize
}

export type Employee = {
  id: string
  name: string
}

export type TenderOption = {
  id: string
  label: string
  detail: string
}

export type DeviceCapabilities = {
  model: string
  productName: string
  serial: string
  securePayments: boolean
  secureTouch: boolean
  bundledPrinter: boolean
  customerMode: boolean
  customerRotation: boolean
  merchantOnly: boolean
  paymentOnly: boolean
}

export type MerchantContext = {
  merchantId: string
  displayName: string
  taxMode: TaxMode
}

export type BootstrapPayload = {
  merchant: MerchantContext
  catalog: CatalogItem[]
  employees: Employee[]
  tenders: TenderOption[]
  device: DeviceCapabilities
  runtimeMode: RuntimeMode
}

export type OrderLineInput = {
  itemId: string
  quantity: number
}

export type UpsertOrderRequest = {
  orderId?: string
  employeeId: string
  lines: OrderLineInput[]
}

export type UpsertOrderResponse = {
  orderId: string
  totalCents: number
  currency: 'USD'
  lineCount: number
}

export type StartPaymentRequest = {
  orderId: string
  amountCents: number
  tenderId: string
  employeeId: string
}

export type PaymentResult = {
  status: PaymentStatus
  paymentId?: string
  message?: string
}

export type FinalizeOrderRequest = {
  orderId: string
  paymentId?: string | null
  paymentStatus: PaymentStatus
}

export type FinalizeOrderResponse = {
  orderId: string
  status: 'closed'
  closedAt: string
}

export type PosDataClient = {
  getBootstrap: () => Promise<BootstrapPayload>
  upsertOrder: (request: UpsertOrderRequest) => Promise<UpsertOrderResponse>
  startPayment: (request: StartPaymentRequest) => Promise<PaymentResult>
  finalizeOrder: (request: FinalizeOrderRequest) => Promise<FinalizeOrderResponse>
}
