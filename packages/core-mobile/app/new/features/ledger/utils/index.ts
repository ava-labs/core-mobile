import { ChainId, Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { LedgerAppType, LedgerDerivationPathType } from 'services/ledger/types'
import { z } from 'zod'
import { Curve } from 'utils/publicKeys'

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
