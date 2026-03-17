import { router } from 'expo-router'
import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
import { OnDelegationProgress } from 'contexts/DelegationContext'
import { z } from 'zod'
import { RpcMethod } from '@avalabs/vm-module-types'
import { ledgerParamsStore, StakingProgressParams } from '../store'

export const showLedgerReviewTransaction = ({
  rpcMethod,
  network,
  onApprove,
  onReject,
  stakingProgress
}: {
  rpcMethod?: RpcMethod
  network: Network
  onApprove: (onProgress?: OnDelegationProgress) => Promise<void>
  onReject: (message?: string) => void
  stakingProgress?: StakingProgressParams
}): void => {
  ledgerParamsStore.getState().setReviewTransactionParams({
    rpcMethod,
    network,
    onApprove,
    onReject,
    stakingProgress
  })

  const route =
    stakingProgress === undefined
      ? '/ledgerReviewTransaction'
      : '/ledgerReviewStaking'

  // add a slight delay to ensure navigation to the ledger review screen works reliably
  setTimeout(() => {
    router.navigate(route)
  }, 100)
}

export const getLedgerAppName = (network?: Network): LedgerAppType => {
  return network?.chainId === ChainId.AVALANCHE_MAINNET_ID ||
    network?.chainId === ChainId.AVALANCHE_TESTNET_ID ||
    network?.vmName === NetworkVMType.AVM ||
    network?.vmName === NetworkVMType.PVM
    ? LedgerAppType.AVALANCHE
    : network?.vmName === NetworkVMType.EVM
    ? LedgerAppType.ETHEREUM
    : network?.vmName === NetworkVMType.BITCOIN
    ? LedgerAppType.BITCOIN
    : network?.vmName === NetworkVMType.SVM
    ? LedgerAppType.SOLANA
    : LedgerAppType.UNKNOWN
}

export const LedgerWalletSecretSchema = z.looseObject({
  deviceId: z.string(),
  deviceName: z.string(),
  derivationPathSpec: z.nativeEnum(LedgerDerivationPathType),
  extendedPublicKeys: z.record(
    z.string(),
    z.object({
      evm: z.string().optional(),
      avalanche: z.string().optional()
    })
  ),
  publicKeys: z.array(
    z.object({
      key: z.string(),
      derivationPath: z.string(),
      curve: z.string()
    })
  )
})
