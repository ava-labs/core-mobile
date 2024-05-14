import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { Avalanche } from '@avalabs/wallets-sdk'

export function getChainAliasFromNetwork(
  network: Network
): Avalanche.ChainIDAlias | undefined {
  switch (network.vmName) {
    case NetworkVMType.BITCOIN:
      return undefined
    case NetworkVMType.AVM:
      return 'X'
    case NetworkVMType.PVM:
      return 'P'
    case NetworkVMType.EVM:
    case NetworkVMType.CoreEth:
      return 'C'
  }
}
