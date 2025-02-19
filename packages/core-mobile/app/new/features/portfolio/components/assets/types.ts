import { LocalTokenWithBalance } from 'store/balance'

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  index: number
  formattedBalance: string
  onPress: () => void
  formattedPrice: string
  status: 'up' | 'down' | 'equal'
}
