import { Big, bnToBig } from '@avalabs/avalanche-wallet-sdk'
import {
  Asset,
  AssetType,
  BitcoinConfigAsset,
  Blockchain,
  EthereumConfigAsset
} from '@avalabs/bridge-sdk'
import {
  ERC20WithBalance,
  useWalletStateContext
} from '@avalabs/wallet-react-components'

import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { getEthereumBalance } from 'screens/bridge/handlers/getEthereumBalance'
import { AssetBalance } from 'screens/bridge/utils/types'
import { selectActiveNetwork } from 'store/network'

/**
 * Get the balance of a bridge supported asset for the given blockchain.
 */
export function useSingularAssetBalanceEVM(
  asset: Asset | undefined,
  source: Blockchain
): AssetBalance | undefined {
  const [ethBalance, setEthBalance] = useState<Big>()
  const { addresses, erc20Tokens } = useWalletStateContext()!
  const network = useSelector(selectActiveNetwork)
  // const refetchInterval = useInterval(BALANCE_REFRESH_INTERVAL);

  // TODO update this when adding support for /convert
  const showDeprecated = false

  const avalancheBalance = useMemo(() => {
    if (
      asset &&
      (asset.assetType === AssetType.ERC20 ||
        asset.assetType === AssetType.BTC) &&
      source === Blockchain.AVALANCHE
    ) {
      return getAvalancheBalance(asset, erc20Tokens)
    }
  }, [asset, source, erc20Tokens])

  // fetch balance from Ethereum
  useEffect(() => {
    if (!asset || source !== Blockchain.ETHEREUM) {
      setEthBalance(undefined)
      return
    }

    ;(async function getBalances() {
      const balance = await getEthereumBalance(
        asset,
        addresses.addrC,
        showDeprecated,
        network
      )

      setEthBalance(balance)
    })()
  }, [
    addresses.addrC,
    asset,
    source,
    showDeprecated
    // // refetchInterval is here to ensure the balance is updated periodically
    // refetchInterval,
  ])

  const balance =
    source === Blockchain.AVALANCHE
      ? avalancheBalance
      : source === Blockchain.ETHEREUM
      ? ethBalance
      : undefined

  return asset && ({ symbol: asset.symbol, asset, balance } as AssetBalance)
}

function getAvalancheBalance(
  asset: EthereumConfigAsset | BitcoinConfigAsset,
  erc20Tokens: ERC20WithBalance[]
): Big {
  const erc20TokensByAddress = erc20Tokens.reduce<{
    [address: string]: ERC20WithBalance
  }>((tokens, token) => {
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokens[token.address.toLowerCase()] = token
    return tokens
  }, {})

  const token = erc20TokensByAddress[asset.wrappedContractAddress]
  return token && bnToBig(token.balance, token.denomination)
}
