export type PosRuntimeConfig = {
  mockMode: boolean
  bffBaseUrl: string
}

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) {
    return defaultValue
  }

  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Error(`Invalid boolean value "${value}" in environment configuration`)
}

export const getRuntimeConfig = (): PosRuntimeConfig => {
  const mockMode = parseBoolean(import.meta.env.VITE_CLOVER_MOCK_MODE, true)
  const bffBaseUrl = import.meta.env.VITE_LEVELS_BFF_BASE || 'http://127.0.0.1:8787'

  return { mockMode, bffBaseUrl }
}
