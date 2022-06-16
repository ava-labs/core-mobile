import {
  Asset,
  AssetType,
  BitcoinConfigAsset,
  Blockchain,
  EthereumConfigAsset
} from '@avalabs/bridge-sdk'

import { useEffect, useMemo, useState } from 'react'
import { getEthereumBalance } from 'screens/bridge/handlers/getEthereumBalance'
import { AssetBalance } from 'screens/bridge/utils/types'
import Big from 'big.js'
import { useTokens } from 'hooks/useTokens'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveAccount } from 'hooks/useActiveAccount'
import {
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20
} from 'store/balance'
import { bnToBig } from '@avalabs/utils-sdk'

/**
 * Get the balance of a bridge supported asset for the given blockchain.
 */
export function useSingularAssetBalanceEVM(
  asset: Asset | undefined,
  source: Blockchain
): AssetBalance | undefined {
  const [ethBalance, setEthBalance] = useState<Big>()
  const tokens = useTokens()
  const network = useActiveNetwork()
  const activeAccount = useActiveAccount()

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
      return getAvalancheBalance(asset, tokens)
    }
  }, [asset, source, tokens])

  // fetch balance from Ethereum
  useEffect(() => {
    if (!asset || source !== Blockchain.ETHEREUM) {
      setEthBalance(undefined)
      return
    }

    async function getBalances() {
      if (!asset || !activeAccount || !network) return
      const balance = await getEthereumBalance(
        asset,
        activeAccount.address,
        showDeprecated,
        network
      )

      setEthBalance(balance)
    }

    getBalances()
  }, [
    activeAccount?.address,
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
  erc20Tokens: TokenWithBalance[]
): Big {
  const erc20TokensByAddress = erc20Tokens.reduce<{
    [address: string]: TokenWithBalanceERC20
  }>((tokens, token) => {
    if (token.type !== TokenType.ERC20) {
      return tokens
    }
    // Need to convert the keys to lowercase because they are mixed case, and this messes up or comparison function
    tokens[token.address.toLowerCase()] = token
    return tokens
  }, {})

  const token = erc20TokensByAddress[asset.wrappedContractAddress]
  return token && bnToBig(token.balance, token.decimals)
}
