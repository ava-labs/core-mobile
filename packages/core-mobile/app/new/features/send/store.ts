import { createZustandStore } from 'common/utils/createZustandStore'
import { NftItem } from 'services/nft/types'
import { LocalTokenWithBalance } from 'store/balance'

export const useSendSelectedToken = createZustandStore<
  LocalTokenWithBalance | NftItem | undefined
>(undefined)
