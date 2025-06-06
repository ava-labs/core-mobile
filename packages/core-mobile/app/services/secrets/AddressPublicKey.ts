import { hex } from '@scure/base'
import { mnemonicToSeed } from 'bip39'
import { fromBase58, fromSeed } from 'bip32'
import slip10 from 'micro-key-producer/slip10.js'
import { ethErrors } from 'eth-rpc-errors'
import {
  AddressPublicKeyJson,
  Curve,
  ExtendedPublicKey,
  PrimaryWalletSecrets,
  SecretsError,
  SecretType
} from './types'
import {
  assertDerivationPath,
  getExtendedPublicKeyFor,
  getPublicKeyFor
} from './utils'

export class AddressPublicKey<HasDerivationPath extends boolean = true> {
  private readonly type = 'address-pubkey'

  constructor(
    public key: string,
    public curve: Curve,
    public derivationPath: HasDerivationPath extends true ? string : null
  ) {}

  toJSON(): AddressPublicKeyJson<HasDerivationPath> {
    return {
      type: this.type,
      curve: this.curve,
      derivationPath: this.derivationPath,
      key: this.key
    }
  }

  static fromJSON(json: Omit<AddressPublicKeyJson, 'type'>): AddressPublicKey {
    return new AddressPublicKey(json.key, json.curve, json.derivationPath)
  }

  static async fromSecrets(
    secrets: PrimaryWalletSecrets,
    curve: Curve,
    derivationPath?: string
  ): Promise<AddressPublicKey<boolean>> {
    // With mnemonic wallets, we can derive the public key from the seed phrase.
    if (secrets.secretType === SecretType.Mnemonic) {
      assertDerivationPath(derivationPath)
      return AddressPublicKey.fromSeedphrase(
        secrets.mnemonic,
        curve,
        derivationPath
      )
    }

    // For Ledger Live and Seedless, we should already have the public keys stored.
    // We just need to find them:
    if (secrets.secretType === SecretType.Seedless) {
      assertDerivationPath(derivationPath)

      const pubKeyJson = getPublicKeyFor(secrets, derivationPath, curve)

      if (pubKeyJson) {
        return AddressPublicKey.fromJSON(pubKeyJson)
      }
    }

    throw ethErrors.rpc.internal({
      data: {
        reason: SecretsError.UnsupportedSecretType,
        context: secrets.secretType
      }
    })
  }

  static fromExtendedPublicKeys(
    xpubs: ExtendedPublicKey[],
    curve: Curve,
    derivationPath: string
  ): AddressPublicKey<true> {
    assertDerivationPath(derivationPath)

    if (curve !== 'secp256k1') {
      throw ethErrors.rpc.internal({
        data: {
          reason: SecretsError.UnsupportedCurve,
          context: `"${curve}" is not supported with extended public keys`
        }
      })
    }

    const matchingXpub = getExtendedPublicKeyFor(xpubs, derivationPath, curve)

    if (!matchingXpub) {
      throw ethErrors.rpc.internal({
        data: {
          reason: SecretsError.MissingExtendedPublicKey,
          context: `${derivationPath} / ${curve}`
        }
      })
    }

    const pathSuffix = derivationPath.slice(
      matchingXpub.derivationPath.length + 1 // Add one to account for the trailing slash from the lookup
    )
    const node = fromBase58(matchingXpub.key).derivePath(pathSuffix)
    const key = hex.encode(new Uint8Array(node.publicKey))

    return new AddressPublicKey(key, curve, derivationPath)
  }

  static async fromSeedphrase(
    seedphrase: string,
    curve: Curve,
    derivationPath: string
  ): Promise<AddressPublicKey> {
    assertDerivationPath(derivationPath)
    const seed = await mnemonicToSeed(seedphrase)
    let key: string

    switch (curve) {
      case 'secp256k1': {
        const seedNode = fromSeed(seed)
        key = hex.encode(
          new Uint8Array(seedNode.derivePath(derivationPath).publicKey)
        )
        break
      }

      case 'ed25519': {
        const hdKey = slip10.fromMasterSeed(new Uint8Array(seed))
        key = hex.encode(hdKey.derive(derivationPath).publicKeyRaw)
        break
      }

      default:
        throw ethErrors.rpc.internal({
          data: {
            reason: SecretsError.UnsupportedCurve,
            context: curve
          }
        })
    }

    return new AddressPublicKey(key, curve, derivationPath)
  }
}
