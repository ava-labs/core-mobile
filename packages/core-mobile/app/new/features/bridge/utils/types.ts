import { BridgeAsset } from '@avalabs/bridge-unified'

export interface AssetBalance {
  symbol: string
  asset: BridgeAsset
  balance: bigint | undefined
  symbolOnNetwork?: string
  logoUri?: string
  priceInCurrency?: number
}
