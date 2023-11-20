import { NetworkVMType } from '@avalabs/chains-sdk'
import * as cs from '@cubist-dev/cubesigner-sdk'
import { PubKeyType } from 'services/wallet/types'
import { strip0x } from '@avalabs/utils-sdk'
import {
  BytesLike,
  TransactionRequest,
  getBytes,
  hashMessage,
  JsonRpcProvider
} from 'ethers'
import { networks } from 'bitcoinjs-lib'
import {
  Avalanche,
  getBtcAddressFromPubKey,
  getEvmAddressFromPubKey
} from '@avalabs/wallets-sdk'
import { sha256 } from '@noble/hashes/sha256'
import { EVM, hexToBuffer } from '@avalabs/avalanchejs-v2'
import {
  SignTypedDataVersion,
  TypedDataUtils,
  typedSignatureHash
} from '@metamask/eth-sig-util'
import { RpcMethod } from 'store/walletConnectV2/types'
import { assertNotUndefined } from 'utils/assertions'
import { SeedlessSessionStorage } from './SeedlessSessionStorage'

export default class SeedlessWallet {
  #session: cs.SignerSession | undefined
  #addressPublicKey: PubKeyType | undefined

  private get session(): cs.SignerSession {
    assertNotUndefined(this.#session, 'no session available')
    return this.#session
  }

  private set session(session: cs.SignerSession) {
    this.#session = session
  }

  private get addressPublicKey(): PubKeyType {
    assertNotUndefined(this.#addressPublicKey, 'no addressPublicKey available')
    return this.#addressPublicKey
  }

  private set addressPublicKey(addressPublicKey: PubKeyType) {
    this.#addressPublicKey = addressPublicKey
  }

  private async getPublicKeys(): Promise<PubKeyType[]> {
    // get derived keys only and group them
    const allKeys = await this.session.keys()

    const requiredKeyTypes = [
      cs.Secp256k1.Evm.toString(),
      cs.Secp256k1.Ava.toString()
    ]
    const keys = allKeys
      ?.filter(
        k =>
          k.enabled &&
          requiredKeyTypes.includes(k.key_type) &&
          Boolean(k.derivation_info?.derivation_path)
      )
      .reduce<Record<string, Record<string, cs.KeyInfo>[]>>((acc, key) => {
        const { derivation_info } = key

        if (
          !derivation_info ||
          derivation_info.derivation_path.split('/').pop() === undefined
        ) {
          return acc
        }

        const { mnemonic_id, derivation_path } = derivation_info
        const index = Number(derivation_path.split('/').pop())

        const mnemonicBlock = acc[mnemonic_id] || []

        mnemonicBlock[index] = {
          ...mnemonicBlock[index],
          [key.key_type]: key
        }

        acc[mnemonic_id] = mnemonicBlock

        return acc
      }, {})

    if (Object.keys(keys).length === 0) {
      throw new Error('Accounts not created')
    }

    const allDerivedKeySets = Object.values(keys)

    // We only look for key sets that contain all of the required key types.
    const validKeySets = allDerivedKeySets.filter(keySet => {
      return keySet.every(key => requiredKeyTypes.every(type => key[type]))
    })

    if (!validKeySets[0]) {
      throw new Error('Accounts keys missing')
    }

    // If there are multiple valid sets, we choose the first one.
    const derivedKeys = validKeySets[0]
    const pubkeys: PubKeyType[] = []

    derivedKeys.forEach(key => {
      const AvaKey = key[cs.Secp256k1.Ava]
      const EvmKey = key[cs.Secp256k1.Evm]

      if (!AvaKey || !EvmKey) {
        return
      }

      pubkeys.push({
        evm: strip0x(EvmKey.public_key),
        xp: strip0x(AvaKey.public_key)
      })
    })

    if (pubkeys.length === 0) {
      throw new Error('Address not found')
    }

    return pubkeys
  }

  private async getSigningKeyByAddress(
    lookupAddress: string
  ): Promise<cs.KeyInfo> {
    const keys = await this.session.keys()

    const key = keys.find(({ material_id }) => material_id === lookupAddress)

    if (!key) {
      throw new Error('Signing key not found')
    }

    return key
  }

  private async getSigningKeyByTypeAndKey(
    type: cs.Secp256k1,
    lookupPublicKey?: string
  ): Promise<cs.KeyInfo> {
    if (!lookupPublicKey) {
      throw new Error('Public key not available')
    }

    const keys = await this.session.keys()

    const key = keys
      .filter(({ key_type }) => key_type === type)
      .find(({ publicKey }) => strip0x(publicKey) === lookupPublicKey)

    if (!key) {
      throw new Error('Signing key not found')
    }

    return key
  }

  private getPubKeyBufferC(): Buffer {
    return Buffer.from(this.addressPublicKey.evm, 'hex')
  }

  private getPubKeyBufferXP(): Buffer {
    if (!this.addressPublicKey.xp)
      throw new Error('xp public key not available')

    return Buffer.from(this.addressPublicKey.xp, 'hex')
  }

  private async signBlob(address: string, digest: BytesLike): Promise<string> {
    const blobReq = {
      message_base64: Buffer.from(getBytes(digest)).toString('base64')
    }

    const key = await this.getSigningKeyByAddress(address)

    const res = await this.session.signBlob(key.key_id, blobReq)
    return res.data().signature
  }

  static create = async (accountIndex: number): Promise<SeedlessWallet> => {
    const wallet = new SeedlessWallet()
    const storage = new SeedlessSessionStorage()

    wallet.session = await cs.CubeSigner.loadSignerSession(storage)

    const pubKeys = await wallet.getPublicKeys()

    if (!pubKeys) throw new Error('Public keys not available')

    const addressPublicKey = pubKeys[accountIndex]

    if (!addressPublicKey) {
      throw new Error(`Public key not available for index ${accountIndex}`)
    }

    wallet.addressPublicKey = addressPublicKey

    return wallet
  }

  getPublicKey(): PubKeyType {
    return this.addressPublicKey
  }

  getAddresses(
    isTestnet: boolean,
    provXP: Avalanche.JsonRpcProvider
  ): Record<NetworkVMType, string> {
    const pubKeyBufferC = this.getPubKeyBufferC()

    // X/P addresses use a different public key because derivation path is different
    const pubKeyBufferXP = this.getPubKeyBufferXP()
    const addrX = provXP.getAddress(pubKeyBufferXP, 'X')
    const addrP = provXP.getAddress(pubKeyBufferXP, 'P')

    return {
      [NetworkVMType.EVM]: getEvmAddressFromPubKey(pubKeyBufferC).toLowerCase(),
      [NetworkVMType.BITCOIN]: getBtcAddressFromPubKey(
        pubKeyBufferC,
        isTestnet ? networks.testnet : networks.bitcoin
      ),
      [NetworkVMType.AVM]: addrX,
      [NetworkVMType.PVM]: addrP,
      [NetworkVMType.CoreEth]: provXP.getAddress(pubKeyBufferC, 'C')
    }
  }

  async signMessage({
    rpcMethod,
    data
  }: {
    rpcMethod: RpcMethod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  }): Promise<string> {
    const addressEVM = getEvmAddressFromPubKey(
      this.getPubKeyBufferC()
    ).toLowerCase()

    switch (rpcMethod) {
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
        return this.signBlob(
          addressEVM,
          hashMessage(Uint8Array.from(Buffer.from(strip0x(data), 'hex')))
        )
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
        return this.signBlob(addressEVM, typedSignatureHash(data))
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        // Not using cs.ethers.Signer.signTypedData due to the strict type verification in Ethers
        // dApps in many cases have requests with extra unused types. In these cases ethers throws an error, rightfully.
        // However since MM supports these malformed messages, we have to as well. Otherwise Core would look broken.
        const hash = TypedDataUtils.eip712Hash(
          data,
          rpcMethod === RpcMethod.SIGN_TYPED_DATA_V3
            ? SignTypedDataVersion.V3
            : SignTypedDataVersion.V4
        ).toString('hex')
        return this.signBlob(addressEVM, `0x${hash}`)
      }

      default:
        throw new Error('Unknown message type method')
    }
  }

  async signEvmTransaction(
    tx: TransactionRequest,
    provider: JsonRpcProvider
  ): Promise<string> {
    const signer = new cs.ethers.Signer(
      getEvmAddressFromPubKey(this.getPubKeyBufferC()),
      this.session,
      { provider }
    )

    return signer.signTransaction(tx)
  }

  async signAvalancheTx(
    request: Avalanche.SignTxRequest
  ): Promise<Avalanche.SignTxRequest['tx']> {
    const isEvmTx = request.tx.getVM() === EVM

    const key = isEvmTx
      ? await this.getSigningKeyByTypeAndKey(
          cs.Secp256k1.Evm,
          this.addressPublicKey.evm
        )
      : await this.getSigningKeyByTypeAndKey(
          cs.Secp256k1.Ava,
          this.addressPublicKey.xp
        )

    const response = await this.session.signBlob(key.key_id, {
      message_base64: Buffer.from(sha256(request.tx.toBytes())).toString(
        'base64'
      )
    })

    request.tx.addSignature(hexToBuffer(response.data().signature))

    return request.tx
  }

  getReadOnlyWallet(provXP: Avalanche.JsonRpcProvider): Avalanche.WalletVoid {
    const pubKeyBufferC = this.getPubKeyBufferC()
    const pubKeyBufferXP = this.getPubKeyBufferXP()

    return Avalanche.WalletVoid.fromPublicKey(
      pubKeyBufferXP,
      pubKeyBufferC,
      provXP
    )
  }
}
