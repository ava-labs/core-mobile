import { Asset } from '@avalabs/bridge-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'
import Big from 'big.js'

export interface AssetBalance {
  symbol: string
  asset: Asset | BridgeAsset
  balance: Big | undefined
  symbolOnNetwork?: string
  logoUri?: string
  priceInCurrency?: number
}

export enum BridgeProvider {
  LEGACY = 'legacy',
  UNIFIED = 'unified'
}
