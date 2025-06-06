import { createZustandStore } from 'common/utils/createZustandStore'
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
