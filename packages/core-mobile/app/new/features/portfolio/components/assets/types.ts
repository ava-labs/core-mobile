import { SquareButtonIconType } from '@avalabs/k2-alpine'
import { LocalTokenWithBalance } from 'store/balance'
import {
  AssetBalanceSort,
  AssetManageView,
  AssetNetworkFilter,
  ActionButtonTitle
} from './consts'

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

export type ActionButton = {
  title: ActionButtonTitle
  icon: SquareButtonIconType
}
