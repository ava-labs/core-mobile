import { ChainId, Network } from '@avalabs/core-chains-sdk'
import { Network as vmModuleNetwork } from '@avalabs/vm-module-types'

export const isDevnet = (network: Network | vmModuleNetwork): boolean =>
  network.chainId === ChainId.AVALANCHE_DEVNET_P || network.chainId === 43117
