import { createZustandStore } from 'common/utils/createZustandStore'
import { CryptoCurrency } from '../types'
import { PaymentMethods, ServiceProviders } from '../consts'

export const useOffRampToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useOffRampServiceProvider = createZustandStore<
  ServiceProviders | undefined
>(undefined)

export const useOffRampPaymentMethod = createZustandStore<
  PaymentMethods | undefined
>(undefined)

export const useOffRampSourceAmount = createZustandStore<number | undefined>(
  undefined
)
