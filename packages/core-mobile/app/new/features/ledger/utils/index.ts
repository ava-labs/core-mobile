import { router } from 'expo-router'
import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType } from 'services/ledger/types'
import { ledgerParamsCache } from '../services/ledgerParamsCache'

export const showLedgerReviewTransaction = ({
  network,
  onApprove,
  onReject
}: {
  network: Network
  onApprove: () => Promise<void>
  onReject: (message?: string) => void
}): void => {
  ledgerParamsCache.ledgerReviewTransactionParams.set({
    network,
    onApprove,
    onReject
  })
  setTimeout(() => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/ledgerReviewTransaction')
  }, 100)
}

export const getLedgerAppName = (network: Network): LedgerAppType => {
  return network.chainId === ChainId.AVALANCHE_MAINNET_ID ||
    network.chainId === ChainId.AVALANCHE_TESTNET_ID ||
    network.vmName === NetworkVMType.AVM ||
    network.vmName === NetworkVMType.PVM
    ? LedgerAppType.AVALANCHE
    : network.vmName === NetworkVMType.EVM
    ? LedgerAppType.ETHEREUM
    : network.vmName === NetworkVMType.BITCOIN
    ? LedgerAppType.BITCOIN
    : network.vmName === NetworkVMType.SVM
    ? LedgerAppType.SOLANA
    : LedgerAppType.UNKNOWN
}
