import React, { useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import type { Network } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { SelectSwapV2TokenScreen } from 'features/swapV2/screens/SelectSwapV2TokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swapV2/hooks/useZustandStore'
import { useSupportedChains } from 'features/swapV2/hooks/useSupportedChains'
import { TOKEN_IDS } from 'consts/tokenIds'

const SelectSwapV2FromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const [selectedToToken] = useSwapSelectedToToken()
  const { networkChainId } = useLocalSearchParams<{ networkChainId?: string }>()

  // Get all source chains (no filtering for FROM selection)
  const { chains } = useSupportedChains()

  // When TO is Bitcoin and browsing Avalanche as source, only BTC.b is eligible
  const tokenFilter = useCallback(
    (token: LocalTokenWithBalance, selectedNetwork: Network | undefined) => {
      if (
        selectedToToken?.networkChainId &&
        isBitcoinChainId(selectedToToken.networkChainId) &&
        selectedNetwork !== undefined &&
        isAvalancheCChainId(selectedNetwork.chainId)
      ) {
        return token.internalId === TOKEN_IDS.BTC_B
      }
      return true
    },
    [selectedToToken?.networkChainId]
  )

  return (
    <SelectSwapV2TokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
      hideZeroBalance={true}
      // Pre-select network to match "to" token's network
      defaultNetworkChainId={
        networkChainId ? parseInt(networkChainId, 10) : undefined
      }
      // Pass all source chains
      networks={chains}
      tokenFilter={tokenFilter}
    />
  )
}

export default SelectSwapV2FromTokenScreen
