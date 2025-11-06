import { createZustandStore } from 'common/utils/createZustandStore'

export const useIsRefetchingAccountBalances = createZustandStore<
  Record<string, boolean>
>({})

export const useIsRefetchingWalletXpBalances = createZustandStore<
  Record<string, boolean>
>({})
