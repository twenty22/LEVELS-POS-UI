import type { CatalogItem, DeviceCapabilities, Employee, MerchantContext, TenderOption } from './contracts'

export const mockMerchant: MerchantContext = {
  merchantId: 'LEVELS-DEMO-MERCHANT',
  displayName: 'LEVELS VI',
  taxMode: 'none',
}

export const mockCatalog: CatalogItem[] = [
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

export const mockEmployees: Employee[] = [
  { id: 'bartender-a', name: 'Bartender A' },
  { id: 'bartender-b', name: 'Bartender B' },
  { id: 'bartender-c', name: 'Bartender C' },
  { id: 'bartender-d', name: 'Bartender D' },
]

export const mockTenders: TenderOption[] = [
  { id: 'tap', label: 'Tap', detail: 'Fastest card flow' },
  { id: 'chip', label: 'Chip', detail: 'Fallback ready' },
  { id: 'cash', label: 'Cash', detail: 'Drawer A' },
  { id: 'gift', label: 'Gift', detail: 'Scan or key in' },
]

export const mockDeviceCapabilities: DeviceCapabilities = {
  model: 'C403',
  productName: 'Clover Flex 4',
  serial: 'FLEX4-DEMO-001',
  securePayments: true,
  secureTouch: true,
  bundledPrinter: true,
  customerMode: true,
  customerRotation: true,
  merchantOnly: false,
  paymentOnly: false,
}
