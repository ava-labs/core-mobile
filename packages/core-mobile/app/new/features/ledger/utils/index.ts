import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
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
