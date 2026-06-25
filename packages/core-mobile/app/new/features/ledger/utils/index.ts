import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerMultiIndexKeys,
  PublicKeyInfo,
  WalletSecretOperation,
  WalletSecretParams
} from 'services/ledger/types'
import { z } from 'zod'
import { Curve } from 'utils/publicKeys'
import { MAX_BITCOIN_APP_VERSION } from '../consts'

/**
 * Returns true if version is strictly greater than maxVersion (semver comparison).
 */
export const isVersionExceeding = (
  version: string,
  maxVersion: string
): boolean => {
  const parse = (v: string): number[] => v.split('.').map(Number)
  const v = parse(version)
  const max = parse(maxVersion)
  for (let i = 0; i < Math.max(v.length, max.length); i++) {
    const a = v[i] ?? 0
    const b = max[i] ?? 0
    if (a > b) return true
    if (a < b) return false
  }
  return false
}

/**
 * Returns true if the detected app type is compatible with a Bitcoin signing request.
 * - Bitcoin Recovery app is always accepted as a substitute.
 * - Regular Bitcoin app is only accepted if its version is within the supported range.
 */
export const isBitcoinCompatibleApp = (
  appType: LedgerAppType,
  appVersion: string
): boolean => {
  if (appType === LedgerAppType.BITCOIN_RECOVERY) return true
  if (appType === LedgerAppType.BITCOIN) {
    return !isVersionExceeding(appVersion, MAX_BITCOIN_APP_VERSION)
  }
  return false
}

export const getLedgerAppName = (network?: Network): LedgerAppType => {
  if (!network) return LedgerAppType.UNKNOWN

  const isAvalancheChain =
    network.chainId === ChainId.AVALANCHE_MAINNET_ID ||
    network.chainId === ChainId.AVALANCHE_TESTNET_ID ||
    network.chainId === ChainId.AVALANCHE_LOCAL_ID

  const isAvalancheVM = [NetworkVMType.AVM, NetworkVMType.PVM].includes(
    network.vmName
  )

  const isAvalancheL1 =
    network.vmName === NetworkVMType.EVM && Boolean(network.subnetId)

  if (isAvalancheChain || isAvalancheVM || isAvalancheL1)
    return LedgerAppType.AVALANCHE

  switch (network.vmName) {
    case NetworkVMType.EVM:
      return LedgerAppType.ETHEREUM
    case NetworkVMType.BITCOIN:
      return LedgerAppType.BITCOIN
    case NetworkVMType.SVM:
      return LedgerAppType.SOLANA
    default:
      return LedgerAppType.UNKNOWN
  }
}

const BtcWalletPolicySchema = z.object({
  hmacHex: z.string(),
  masterFingerprint: z.string(),
  xpub: z.string(),
  name: z.string()
})

const PublicKeyInfoSchema = z.object({
  key: z.string(),
  derivationPath: z.string(),
  curve: z.enum([Curve.SECP256K1, Curve.ED25519]),
  btcWalletPolicy: BtcWalletPolicySchema.optional()
})

export const LedgerWalletSecretSchema = z.looseObject({
  deviceId: z.string(),
  deviceName: z.string(),
  derivationPathSpec: z.enum([
    LedgerDerivationPathType.BIP44,
    LedgerDerivationPathType.LedgerLive
  ]),
  extendedPublicKeys: z
    .record(
      z.string(),
      z.object({
        evm: z.string().optional(),
        avalanche: z.string().optional()
      })
    )
    .optional(),
  publicKeys: z
    .record(z.string(), z.array(PublicKeyInfoSchema))
    .transform(
      record =>
        Object.fromEntries(
          Object.entries(record).map(([k, v]) => [Number(k), v])
        ) as Record<number, z.infer<typeof PublicKeyInfoSchema>[]>
    )
})

const deduplicatePublicKeys = (keys: PublicKeyInfo[]): PublicKeyInfo[] =>
  keys.filter(
    (pk, idx, arr) =>
      pk !== undefined && arr.findIndex(k => k?.key === pk.key) === idx
  )

// eslint-disable-next-line sonarjs/cognitive-complexity
export const buildLedgerWalletSecret = (params: WalletSecretParams): string => {
  const { deviceId, deviceName, derivationPathType } = params

  const isNew = params.type === WalletSecretOperation.NEW

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base: Record<string, any> = isNew
    ? { deviceId, deviceName, derivationPathSpec: derivationPathType }
    : { ...params.existingWalletSecret }

  // --- Extended public keys (BIP44 only) ---
  if (derivationPathType === LedgerDerivationPathType.BIP44) {
    switch (params.type) {
      case WalletSecretOperation.NEW:
        if (params.extendedPublicKeys) {
          base.extendedPublicKeys = params.extendedPublicKeys
        }
        break
      case WalletSecretOperation.UPDATE:
        if (params.newXpubs) {
          base.extendedPublicKeys = {
            ...(base.extendedPublicKeys ?? {}),
            [params.accountIndex]: params.newXpubs
          }
        }
        break
      case WalletSecretOperation.SOLANA_UPDATE:
        break
    }
  }

  // --- Public keys ---
  switch (params.type) {
    case WalletSecretOperation.NEW:
      base.publicKeys = params.publicKeys
      break

    case WalletSecretOperation.UPDATE: {
      const combined = [
        ...params.newPublicKeys,
        ...(params.newSolanaKeys ?? [])
      ].filter(Boolean) as PublicKeyInfo[]

      base.publicKeys = {
        ...(base.publicKeys ?? {}),
        [params.accountIndex]: deduplicatePublicKeys(combined)
      }
      break
    }

    case WalletSecretOperation.SOLANA_UPDATE: {
      const existing =
        (base.publicKeys?.[params.accountIndex] as PublicKeyInfo[]) ?? []
      const combined = [...existing, ...params.newSolanaKeys].filter(
        Boolean
      ) as PublicKeyInfo[]

      base.publicKeys = {
        ...(base.publicKeys ?? {}),
        [params.accountIndex]: deduplicatePublicKeys(combined)
      }
      break
    }
  }

  // --- Solana addresses (new wallet only) ---
  if (
    params.type === WalletSecretOperation.NEW &&
    params.solanaAddresses &&
    Object.keys(params.solanaAddresses).length > 0
  ) {
    base.solanaAddresses = params.solanaAddresses
  }

  return JSON.stringify(base)
}

/**
 * Fixes double 0x prefixes on EVM and CoreEth addresses that can occur
 * during Ledger address derivation, causing VM module errors.
 */
export const getFormattedAddresses = (addresses: {
  evm: string
  avm: string
  pvm: string
  btc: string
  coreEth: string
}): {
  evm: string
  avm: string
  pvm: string
  btc: string
  coreEth: string
} => ({
  evm: addresses.evm?.startsWith('0x0x')
    ? addresses.evm.slice(2)
    : addresses.evm,
  avm: addresses.avm,
  pvm: addresses.pvm,
  btc: addresses.btc,
  coreEth: addresses.coreEth?.startsWith('0x0x')
    ? addresses.coreEth.slice(2)
    : addresses.coreEth
})

/**
 * Builds per-account extendedPublicKeys and publicKeys records from
 * multi-index Ledger keys. Used during wallet creation with discovery
 * to prepare key material for storage.
 */
export const buildKeysFromMultiIndex = ({
  multiIndexKeys,
  activeIndices,
  derivationPathType
}: {
  multiIndexKeys: LedgerMultiIndexKeys
  activeIndices: number[]
  derivationPathType: LedgerDerivationPathType
}): {
  extendedPublicKeys: Record<number, { evm: string; avalanche: string }>
  publicKeys: Record<number, PublicKeyInfo[]>
} => {
  const extendedPublicKeys: Record<number, { evm: string; avalanche: string }> =
    {}
  const publicKeys: Record<number, PublicKeyInfo[]> = {}

  for (const index of activeIndices) {
    const mainnetKeys = multiIndexKeys.mainnet[index]
    const testnetKeys = multiIndexKeys.testnet[index]

    if (
      derivationPathType === LedgerDerivationPathType.BIP44 &&
      mainnetKeys?.avalancheKeys?.xpubs
    ) {
      extendedPublicKeys[index] = {
        evm: mainnetKeys.avalancheKeys.xpubs.evm,
        avalanche: mainnetKeys.avalancheKeys.xpubs.avalanche
      }
    }

    const allPublicKeys = [
      ...(mainnetKeys?.avalancheKeys?.publicKeys ?? []),
      ...(mainnetKeys?.solanaKeys?.length ? [mainnetKeys.solanaKeys[0]] : []),
      ...(testnetKeys?.avalancheKeys?.publicKeys ?? [])
    ].filter(Boolean)

    publicKeys[index] = deduplicatePublicKeys(allPublicKeys as PublicKeyInfo[])
  }

  return { extendedPublicKeys, publicKeys }
}
