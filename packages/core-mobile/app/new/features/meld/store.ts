import { createZustandStore } from 'common/utils/createZustandStore'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { CryptoCurrency } from './types'
import { PaymentMethods, ServiceProviders } from './consts'

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
