import { Asset } from '@avalabs/bridge-sdk'
import Big from 'big.js'

export interface AssetBalance {
  symbol: string
  asset: Asset
  balance: Big | undefined
  symbolOnNetwork?: string
  logoUri?: string
  priceInCurrency?: number
}
