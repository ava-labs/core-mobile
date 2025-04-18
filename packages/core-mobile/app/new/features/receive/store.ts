import { Network } from '@avalabs/core-chains-sdk'
import { createZustandStore } from 'common/utils/createZustandStore'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'

export const useReceiveSelectedNetwork = createZustandStore<Network>(
  AVALANCHE_MAINNET_NETWORK
)
