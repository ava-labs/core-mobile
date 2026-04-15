import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useLocalSearchParams } from 'expo-router'
import type { Network } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { SelectFromSwapTokenScreen } from 'features/swap/screens/SelectFromSwapTokenScreen'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from 'features/swap/hooks/useZustandStore'
import { useSupportedChains } from 'features/swap/hooks/useSupportedChains'
import { tokenIds } from 'consts/tokenIds'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const SelectSwapFromTokenScreen = (): JSX.Element => {
  const [selectedFromToken, setSelectedFromToken] = useSwapSelectedFromToken()
  const [selectedToToken] = useSwapSelectedToToken()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const btcBTokenId = isDeveloperMode ? tokenIds.BTC_B_FUJI : tokenIds.BTC_B
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
        return token.internalId === btcBTokenId
      }
      return true
    },
    [selectedToToken?.networkChainId, btcBTokenId]
  )

  return (
    <SelectFromSwapTokenScreen
      selectedToken={selectedFromToken}
      setSelectedToken={setSelectedFromToken}
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

export default SelectSwapFromTokenScreen
