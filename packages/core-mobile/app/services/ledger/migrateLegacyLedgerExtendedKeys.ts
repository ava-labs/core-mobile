import { NetworkVMType } from '@avalabs/core-chains-sdk'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'
import { getAddressDerivationPath } from 'services/wallet/utils'
import {
  ExtendedPublicKey,
  LedgerDerivationPathType,
  LedgerWalletData
} from './types'

type LegacyLedgerExtendedPublicKeys = {
  evm?: string
  avalanche?: string
}

type SupportedLedgerVmType =
  | NetworkVMType.AVM
  | NetworkVMType.CoreEth
  | NetworkVMType.EVM

export async function migrateLegacyLedgerExtendedKeys({
  ledgerData,
  walletId,
  persistSecret = true
}: {
  ledgerData: LedgerWalletData
  walletId: string
  persistSecret?: boolean
}): Promise<boolean> {
  if (ledgerData.derivationPathSpec !== LedgerDerivationPathType.BIP44) {
    return false
  }

  const rawExtendedKeys = (
    ledgerData as unknown as {
      extendedPublicKeys?: ExtendedPublicKey[] | LegacyLedgerExtendedPublicKeys
    }
  ).extendedPublicKeys

  if (Array.isArray(rawExtendedKeys)) {
    ledgerData.extendedPublicKeys = rawExtendedKeys
    return false
  }

  const legacyKeys = rawExtendedKeys as
    | LegacyLedgerExtendedPublicKeys
    | undefined
  if (!legacyKeys) {
    ledgerData.extendedPublicKeys = []
    return false
  }

  const convertedKeys = convertLegacyExtendedKeys(legacyKeys)
  if (!convertedKeys.length) {
    ledgerData.extendedPublicKeys = []
    return false
  }

  ledgerData.extendedPublicKeys = convertedKeys

  Logger.info(
    `Migrated legacy Ledger extended public keys for wallet ${walletId}`
  )

  if (persistSecret) {
    await BiometricsSDK.storeWalletSecret(walletId, JSON.stringify(ledgerData))
  }

  return true
}

function convertLegacyExtendedKeys(
  legacyKeys: LegacyLedgerExtendedPublicKeys
): ExtendedPublicKey[] {
  const extendedKeys: ExtendedPublicKey[] = []

  const avalancheKey = buildExtendedKeyFromLegacy(
    legacyKeys.avalanche,
    NetworkVMType.AVM
  )
  if (avalancheKey) {
    extendedKeys.push(avalancheKey)
  }

  const evmKey = buildExtendedKeyFromLegacy(legacyKeys.evm, NetworkVMType.EVM)
  if (evmKey) {
    extendedKeys.push(evmKey)
  }

  return extendedKeys
}

export function buildExtendedKeyFromLegacy(
  key: string | undefined,
  vmType: SupportedLedgerVmType
): ExtendedPublicKey | undefined {
  if (!key) return

  const path = getAddressDerivationPath({
    accountIndex: 0,
    vmType
  }).replace('/0/0', '')

  return {
    path,
    key,
    chainCode: ''
  }
}
