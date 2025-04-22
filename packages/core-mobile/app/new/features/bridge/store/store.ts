import { BridgeAsset } from '@avalabs/bridge-unified'
import { Network } from '@avalabs/core-chains-sdk'
import { createZustandStore } from 'common/utils/createZustandStore'

export const useBridgeSelectedSourceNetwork = createZustandStore<
  Network | undefined
>(undefined)

export const useBridgeSelectedTargetNetwork = createZustandStore<
  Network | undefined
>(undefined)

export const useBridgeSelectedAsset = createZustandStore<
  BridgeAsset | undefined
>(undefined)
