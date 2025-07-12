import { createZustandStore } from 'common/utils/createZustandStore'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { create } from 'zustand'
import { CryptoCurrency } from './types'
import { PaymentMethods, ServiceProviders } from './consts'

export const useMeldCountryCode = createZustandStore<string | undefined>(
  undefined
)

export const useMeldToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useMeldServiceProvider = createZustandStore<
  ServiceProviders | undefined
>(undefined)

export const useMeldPaymentMethod = createZustandStore<
  PaymentMethods | undefined
>(undefined)

export const useMeldFiatAmount = createZustandStore<number | undefined>(
  undefined
)

export const useMeldCryptoAmount = createZustandStore<TokenUnit | undefined>(
  undefined
)

export const offrampSessionIdStore = create<{
  sessionId: string | undefined
  setSessionId: (sessionId?: string) => void
}>(set => ({
  sessionId: undefined,
  setSessionId: (sessionId?: string) => set({ sessionId })
}))

export const useOfframpSessionId = (): {
  sessionId: string | undefined
  setSessionId: (sessionId?: string) => void
} => {
  return offrampSessionIdStore()
}

export const offrampActivityIndicatorStore = create<{
  animating: boolean
  setAnimating: (animating: boolean) => void
}>(set => ({
  animating: false,
  setAnimating: (animating: boolean) => set({ animating })
}))

export const useOfframpActivityIndicator = (): {
  animating: boolean
  setAnimating: (animating: boolean) => void
} => {
  return offrampActivityIndicatorStore()
}
