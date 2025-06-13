import { createZustandStore } from 'common/utils/createZustandStore'
import { CryptoCurrency } from './types'
import { PaymentMethods, ServiceProviders } from './consts'

export const useOnRampToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useOnRampServiceProvider = createZustandStore<
  keyof typeof ServiceProviders | undefined
>(undefined)

export const useOnRampPaymentMethod = createZustandStore<
  PaymentMethods | undefined
>(undefined)
