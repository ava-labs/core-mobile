import { router } from 'expo-router'
import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
import { z } from 'zod'
import LedgerService from 'services/ledger/LedgerService'
import Logger from 'utils/Logger'
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

  // add a slight delay to ensure navigation to the ledger review screen works reliably
  setTimeout(() => {
    // @ts-ignore TODO: make routes typesafe
    router.navigate('/ledgerReviewTransaction')
  }, 100)
}

// if network is undefined, return UNKNOWN
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

export const LedgerWalletSecretSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  derivationPathSpec: z.nativeEnum(LedgerDerivationPathType),
  extendedPublicKeys: z.record(
    z.string(),
    z.object({
      evm: z.string().optional(),
      avalanche: z.string().optional()
    })
  )
})

export const getOppositeKeys = async ({
  acountIndex = 0,
  isDeveloperMode
}: {
  acountIndex?: number
  isDeveloperMode: boolean
}): Promise<{
  addressBTC: string
  addressAVM: string
  addressPVM: string
  addressCoreEth: string
}> => {
  try {
    const avalancheKeys = await LedgerService.getAvalancheKeys(
      acountIndex,
      !isDeveloperMode
    )
    const { bitcoinAddress } = await LedgerService.getBitcoinAndXPAddresses(
      acountIndex,
      !isDeveloperMode
    )

    return {
      addressBTC: bitcoinAddress,
      addressAVM: avalancheKeys.addresses.avm,
      addressPVM: avalancheKeys.addresses.pvm,
      addressCoreEth: avalancheKeys.addresses.coreEth
    }
  } catch (err) {
    Logger.error('Failed to get opposite keys', err)
    return {
      addressBTC: '',
      addressAVM: '',
      addressPVM: '',
      addressCoreEth: ''
    }
  }
}
