import { createZustandStore } from 'common/utils/createZustandStore'
import { CryptoCurrency } from '../types'
import { PaymentMethods, ServiceProviders } from '../consts'

export const useOnrampToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useOnrampServiceProvider = createZustandStore<
  ServiceProviders | undefined
>(undefined)

export const useOnrampPaymentMethod = createZustandStore<
  PaymentMethods | undefined
>(undefined)

export const useOnrampSourceAmount = createZustandStore<number | undefined>(
  undefined
)
