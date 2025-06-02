import { createZustandStore } from 'common/utils/createZustandStore'

export const useOnRampCountryCode = createZustandStore<string | undefined>(
  undefined
)

export const useOnRampCurrencyCode = createZustandStore<string | undefined>(
  undefined
)
