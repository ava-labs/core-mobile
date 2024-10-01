import { Asset } from '@avalabs/core-bridge-sdk'
import { BridgeAsset } from '@avalabs/bridge-unified'

export interface AssetBalance {
  symbol: string
  asset: Asset | BridgeAsset
  balance: bigint | undefined
  symbolOnNetwork?: string
  logoUri?: string
  priceInCurrency?: number
}
