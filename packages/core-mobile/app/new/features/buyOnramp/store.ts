import { createZustandStore } from 'common/utils/createZustandStore'
import { PaymentMethods, ServiceProviders } from 'services/meld/consts'
import { CryptoCurrency } from './hooks/useSearchCryptoCurrencies'

export const useOnRampCountryCode = createZustandStore<string | undefined>(
  undefined
)

export const useOnRampCurrencyCode = createZustandStore<string | undefined>(
  undefined
)

export const useOnRampToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useOnRampServiceProvider = createZustandStore<
  keyof typeof ServiceProviders | undefined
>(undefined)

export const useOnRampPaymentMethod = createZustandStore<
  keyof typeof PaymentMethods | undefined
>(undefined)

export const useOnRampSourceAmount = createZustandStore<number | undefined>(
  undefined
)
