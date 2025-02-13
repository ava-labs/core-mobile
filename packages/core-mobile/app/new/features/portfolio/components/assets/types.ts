import { LocalTokenWithBalance } from 'store/balance'
import { AssetBalanceSort, AssetManageView, AssetNetworkFilter } from './consts'

export type AssetBalanceSorts = AssetBalanceSort[][]
export type AssetNetworkFilters = AssetNetworkFilter[][]
export type AssetManageViews = AssetManageView[][]

export interface TokenListViewProps {
  token: LocalTokenWithBalance
  index: number
  formattedBalance: string
  onPress: () => void
  priceChange?: number
  formattedPrice: string
  status: 'up' | 'down' | 'equal'
}
