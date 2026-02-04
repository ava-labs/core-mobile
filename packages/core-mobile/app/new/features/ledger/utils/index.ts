import { router } from 'expo-router'
import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
import { z } from 'zod'
import { ledgerParamsCache } from '../services/ledgerParamsCache'

export const showLedgerReviewTransaction = ({
  network,
  onApprove,
  onReject,
  stakingProgress
}: {
  network: Network
  onApprove: () => Promise<void>
  onReject: (message?: string) => void
  stakingProgress?: StakingProgressParams
}): void => {
  ledgerParamsCache.ledgerReviewTransactionParams.set({
    network,
    onApprove,
    onReject,
    stakingProgress
  })

  // add a slight delay to ensure navigation to the ledger review screen works reliably
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

export const LedgerWalletSecretSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  derivationPathSpec: z.nativeEnum(LedgerDerivationPathType),
  extendedPublicKeys: z
    .object({
      evm: z.string().optional(),
      avalanche: z.string().optional()
    })
    .optional(),
  publicKeys: z.array(
    z.object({
      key: z.string(),
      derivationPath: z.string(),
      curve: z.string()
    })
  ),
  avalancheKeys: z.object({
    evm: z.string().optional(),
    avm: z.string().optional(),
    pvm: z.string().optional()
  }),
  solanaKeys: z.array(
    z.object({
      key: z.string(),
      derivationPath: z.string(),
      curve: z.string()
    })
  ),
  bitcoinAddress: z.string().optional()
})
