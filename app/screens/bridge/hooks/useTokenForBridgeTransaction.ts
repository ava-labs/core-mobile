import { Blockchain, BridgeTransaction } from '@avalabs/bridge-sdk'
import { BITCOIN_NETWORK, ChainId } from '@avalabs/chains-sdk'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectNetworkContractTokens } from 'store/network'

export function useTokenForBridgeTransaction(
  bridgeTransaction: BridgeTransaction | undefined,
  isTestnet: boolean
) {
  const chainId = useMemo(() => {
    switch (bridgeTransaction?.sourceChain) {
      case Blockchain.BITCOIN:
        return isTestnet ? ChainId.BITCOIN_TESTNET : ChainId.BITCOIN
      case Blockchain.ETHEREUM:
        // ETHEREUM_GOERLI doesn't have contract tokens, so always use ETHEREUM_HOMESTEAD chainid.
        return ChainId.ETHEREUM_HOMESTEAD
      case Blockchain.AVALANCHE:
      default:
        return isTestnet
          ? ChainId.AVALANCHE_TESTNET_ID
          : ChainId.AVALANCHE_MAINNET_ID
    }
  }, [bridgeTransaction, isTestnet])

  const tokens = useSelector(selectNetworkContractTokens(chainId))

  const tokenForBridgeTransaction = useMemo(() => {
    const token = tokens.find(t => t.symbol === bridgeTransaction?.symbol)

    if (token) return token

    if (bridgeTransaction?.symbol === BITCOIN_NETWORK.networkToken.symbol) {
      return BITCOIN_NETWORK.networkToken
    }

    return undefined
  }, [tokens, bridgeTransaction])

  return tokenForBridgeTransaction
}
