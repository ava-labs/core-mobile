import { LocalTokenWithBalance } from 'store/balance'

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  index: number
  formattedBalance: string
  onPress: () => void
  priceChange?: number
  formattedPrice: string
  status: 'up' | 'down' | 'equal'
}
