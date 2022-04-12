import {Asset} from '@avalabs/bridge-sdk'
import {Big} from '@avalabs/avalanche-wallet-sdk'

export interface AssetBalance {
  symbol: string
  asset: Asset
  balance: Big | undefined
}
