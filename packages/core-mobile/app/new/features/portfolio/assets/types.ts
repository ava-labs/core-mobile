import type { PriceChangeStatus } from '@avalabs/k2-alpine'
import { LocalTokenWithBalance } from 'store/balance'

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  index: number
  formattedBalance: string
  onPress: () => void
  formattedPrice: string
  priceChangeStatus: PriceChangeStatus
}
