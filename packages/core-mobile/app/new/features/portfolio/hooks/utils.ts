import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'

/**
 * Polling interval in milliseconds
 * - C-Chain: every 15s
 * - Other EVMs: every 30s
 * - BTC/SOL: every 60s
 * - AVM/PVM: every 5 minutes
 * more info here https://ava-labs.atlassian.net/wiki/spaces/EN/pages/3383361543/Balance+Syncing+Decisions+-+Mobile+Extension+and+Web
 */
export function getFetchingInterval(n: Network): number {
  if (
    n.chainId === ChainId.AVALANCHE_MAINNET_ID ||
    n.chainId === ChainId.AVALANCHE_TESTNET_ID ||
    n.vmName === NetworkVMType.PVM ||
    n.vmName === NetworkVMType.AVM
  )
    return 15_000

  if (n.vmName === NetworkVMType.EVM) return 30_000

  if (n.vmName === NetworkVMType.BITCOIN || n.vmName === NetworkVMType.SVM)
    return 60_000

  // if (n.vmName === NetworkVMType.PVM || n.vmName === NetworkVMType.AVM)
  //   return 300_000 // 5 minutes

  return 60_000 // fallback
}

export const isXpNetwork = (
  network: Network
): network is Network & { vmName: NetworkVMType.PVM | NetworkVMType.AVM } =>
  network.vmName === NetworkVMType.PVM || network.vmName === NetworkVMType.AVM
