import type { PriceChangeStatus } from '@avalabs/k2-alpine'
import { LocalTokenWithBalance } from 'store/balance'

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  tokenNameForDisplay: string
  index: number
  formattedBalance: string | undefined
  onPress: () => void
  formattedPrice: string | undefined
  priceChangeStatus: PriceChangeStatus | undefined
  testID?: string
}
