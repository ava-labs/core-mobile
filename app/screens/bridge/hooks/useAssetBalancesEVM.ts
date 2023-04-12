import {
  Blockchain,
  useBridgeSDK,
  useGetTokenSymbolOnNetwork
} from '@avalabs/bridge-sdk'
import { useEffect, useMemo, useState } from 'react'
import { getEthereumBalances } from 'screens/bridge/handlers/getEthereumBalances'
import { getAvalancheBalances } from 'screens/bridge/handlers/getAvalancheBalances'
import { AssetBalance } from 'screens/bridge/utils/types'
import { useSelector } from 'react-redux'
import { selectTokensWithBalance } from 'store/balance'
import { useEthereumProvider } from 'hooks/networkProviderHooks'
import { selectActiveAccount } from 'store/account'

/**
 * Get for the current chain.
 * Get a list of bridge supported assets with the balances of the current blockchain.
 * The list is sorted by balance.
 */
export function useAssetBalancesEVM(
  chain: Blockchain.AVALANCHE | Blockchain.ETHEREUM
): {
  assetsWithBalances: AssetBalance[]
  loading: boolean
} {
  const [loading, setLoading] = useState(false)
  const [ethBalances, setEthBalances] = useState<AssetBalance[]>([])
  // TODO update this when adding support for /convert
  const showDeprecated = false

  const tokens = useSelector(selectTokensWithBalance)
  const activeAccount = useSelector(selectActiveAccount)
  const { avalancheAssets, ethereumAssets, currentBlockchain } = useBridgeSDK()

  const { getTokenSymbolOnNetwork } = useGetTokenSymbolOnNetwork()
  const ethereumProvider = useEthereumProvider()

  // For balances on the Avalanche side, for all bridge assets on avalanche
  const avalancheBalances = useMemo(() => {
    if (
      chain !== Blockchain.AVALANCHE ||
      currentBlockchain !== Blockchain.AVALANCHE
    ) {
      return []
    }
    return getAvalancheBalances(avalancheAssets, tokens).map(token => ({
      ...token,
      symbolOnNetwork: getTokenSymbolOnNetwork(
        token.symbol,
        Blockchain.AVALANCHE
      )
    }))
  }, [
    chain,
    currentBlockchain,
    avalancheAssets,
    tokens,
    getTokenSymbolOnNetwork
  ])

  // Fetch balances from Ethereum (including native)
  useEffect(() => {
    if (
      chain !== Blockchain.ETHEREUM ||
      currentBlockchain !== Blockchain.ETHEREUM ||
      !ethereumProvider
    ) {
      return
    }
    setLoading(true)
    ;(async function getBalances() {
      const balances = await getEthereumBalances(
        ethereumAssets,
        activeAccount?.address ?? '',
        showDeprecated,
        ethereumProvider
      )
      setLoading(false)
      setEthBalances(balances)
    })()
  }, [
    activeAccount?.address,
    ethereumAssets,
    ethereumProvider,
    chain,
    showDeprecated,
    currentBlockchain
  ])

  const assetsWithBalances = (
    chain === Blockchain.AVALANCHE
      ? avalancheBalances
      : chain === Blockchain.ETHEREUM
      ? ethBalances
      : []
  ).sort((asset1, asset2) => asset2.balance?.cmp(asset1.balance || 0) || 0)

  return { assetsWithBalances, loading }
}
