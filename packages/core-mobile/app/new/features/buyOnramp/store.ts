import { createZustandStore } from 'common/utils/createZustandStore'
import { CryptoCurrency } from './types'

export const useOnRampToken = createZustandStore<CryptoCurrency | undefined>(
  undefined
)

export const useOnRampServiceProvider = createZustandStore<string | undefined>(
  undefined
)
