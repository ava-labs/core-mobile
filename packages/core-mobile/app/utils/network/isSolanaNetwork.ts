import { Network, NetworkVMType, ChainId } from '@avalabs/core-chains-sdk'

export function isSolanaNetwork(network: Network): boolean {
  return network.vmName === NetworkVMType.SVM
}

export function isSolanaChainId(chainId: number): boolean {
  return Boolean(
    [
      ChainId.SOLANA_MAINNET_ID,
      ChainId.SOLANA_DEVNET_ID,
      ChainId.SOLANA_TESTNET_ID
    ].includes(chainId)
  )
}
