import { createZustandStore } from 'common/utils/createZustandStore'
import { LocalTokenWithBalance } from 'store/balance'

export const useSendSelectedToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)
