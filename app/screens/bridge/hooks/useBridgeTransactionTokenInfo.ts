import { Blockchain, BridgeTransaction } from '@avalabs/bridge-sdk'
import { BITCOIN_NETWORK, ChainId } from '@avalabs/chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectNetworkContractTokens } from 'store/network'

export function useBridgeTransactionTokenInfo(
  bridgeTransaction: BridgeTransaction | undefined,
  isTestnet: boolean
) {
  const chainId =
    bridgeTransaction?.sourceChain === Blockchain.BITCOIN
      ? isTestnet
        ? ChainId.BITCOIN_TESTNET
        : ChainId.BITCOIN
      : isTestnet
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID
  const tokens = useSelector(selectNetworkContractTokens(chainId))

  const tokenInfo = useMemo(() => {
    const selectedToken = tokens.find(
      token => token.symbol === bridgeTransaction?.symbol
    )

    if (selectedToken)
      return { symbol: selectedToken.symbol, logoUri: selectedToken.logoUri }

    if (bridgeTransaction?.symbol === BITCOIN_NETWORK.networkToken.symbol) {
      return {
        symbol: BITCOIN_NETWORK.networkToken.symbol,
        logoUri: BITCOIN_NETWORK.networkToken.logoUri
      }
    }

    return undefined
  }, [tokens, bridgeTransaction])

  if (!bridgeTransaction) return undefined

  return tokenInfo
}
