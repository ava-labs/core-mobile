import { Network } from '@avalabs/core-chains-sdk'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { Signer as CsEthersSigner } from '@cubist-labs/cubesigner-sdk-ethers-v6'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  Wallet
} from 'services/wallet/types'
import { strip0x } from '@avalabs/core-utils-sdk'
import { BytesLike, TransactionRequest, getBytes } from 'ethers'
import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal,
  createPsbt,
  getEvmAddressFromPubKey
} from '@avalabs/core-wallets-sdk'
import { sha256 } from '@noble/hashes/sha256'
import { EVM, utils } from '@avalabs/avalanchejs'
import {
  SignTypedDataVersion,
  TypedDataUtils,
  typedSignatureHash
} from '@metamask/eth-sig-util'
import { toUtf8 } from 'ethereumjs-util'
import { getChainAliasFromNetwork } from 'services/network/utils/getChainAliasFromNetwork'
import {
  TypedData,
  TypedDataV1,
  MessageTypes,
  RpcMethod
} from '@avalabs/vm-module-types'
import { isTypedData, isTypedDataV1 } from '@avalabs/evm-module'
import { stripChainAddress } from 'store/account/utils'
import { AddressPublicKey, Curve, isEvmPublicKey } from 'utils/publicKeys'
import { findPublicKey } from 'utils/publicKeys'
import CoreSeedlessAPIService from '../CoreSeedlessAPIService'
import SeedlessService from '../SeedlessService'
import { SeedlessBtcSigner } from './SeedlessBtcSigner'

export default class SeedlessWallet implements Wallet {
  #client: cs.CubeSignerClient
  #addressPublicKeys: AddressPublicKey[]

  constructor(
    client: cs.CubeSignerClient,
    addressPublicKeys: AddressPublicKey[]
  ) {
    this.#client = client
    this.#addressPublicKeys = addressPublicKeys
  }

  private async getMnemonicId(): Promise<string> {
    const keys = await this.#client.apiClient.sessionKeysList()
    // using the first account here since it always exists
    const addressPublicKey = this.getAddressPublicKey(0)

    const activeAccountKey = keys.find(
      key => strip0x(key.public_key) === addressPublicKey
    )

    const mnemonicId = activeAccountKey?.derivation_info?.mnemonic_id

    if (!mnemonicId) {
      throw new Error('Cannot retrieve the mnemonic id')
    }

    return mnemonicId
  }

  private async getSigningKeyByAddress(
    lookupAddress: string
  ): Promise<cs.KeyInfo> {
    const keys = await this.#client.apiClient.sessionKeysList()

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

    const keys = await this.#client.apiClient.sessionKeysList()

    const key = keys
      .filter(({ key_type }) => key_type === type)
      .find(({ public_key }) => strip0x(public_key) === lookupPublicKey)

    if (!key) {
      throw new Error('Signing key not found')
    }

    return key
  }

  private async signBlob(address: string, digest: BytesLike): Promise<string> {
    const blobReq = {
      message_base64: Buffer.from(getBytes(digest)).toString('base64')
    }

    const key = await this.getSigningKeyByAddress(address)

    const res = await this.#client.apiClient.signBlob(key.key_id, blobReq)
    return res.data().signature
  }

  private async signEip191(address: string, data: string): Promise<string> {
    const key = (await this.getSigningKeyByAddress(address)).key_id.replace(
      'Key#',
      ''
    )
    const res = await this.#client.apiClient.signEip191(key, {
      data
    })
    return res.data().signature
  }

  public async addAccount(accountIndex: number): Promise<void> {
    if (accountIndex < 1) {
      // To add a new account, we must already know at least one
      // public key to be able to find the mnemonic ID, which we'll use
      // to derive the next keys.
      throw new Error('Account index must be greater than or equal to 1')
    }

    const identityProof = await this.#client.apiClient.identityProve()
    const mnemonicId = await this.getMnemonicId()

    await CoreSeedlessAPIService.addAccount({
      accountIndex,
      identityProof,
      mnemonicId
    })

    await SeedlessService.refreshSessionKeys()
  }

  public async deriveMissingKeys(): Promise<void> {
    const identityProof = await this.#client.apiClient.identityProve()
    const mnemonicId = await this.getMnemonicId()

    await CoreSeedlessAPIService.deriveMissingKeys({
      identityProof,
      mnemonicId
    })

    await SeedlessService.refreshSessionKeys()
  }

  /** WALLET INTERFACE IMPLEMENTATION **/
  public async signMessage({
    rpcMethod,
    data,
    accountIndex,
    network,
    provider
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal | Avalanche.JsonRpcProvider
  }): Promise<string> {
    const addressEVM = await this.getEvmAddress(accountIndex)

    switch (rpcMethod) {
      case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
        if (typeof data !== 'string') throw new Error('Data must be string')

        const chainAlias = getChainAliasFromNetwork(network)
        if (!chainAlias)
          throw new Error(`Unsupported network ${network.vmName}`)

        if (!(provider instanceof Avalanche.JsonRpcProvider))
          throw new Error(`Unsupported provider`)

        return this.signAvalancheMessage({
          accountIndex,
          message: data,
          provider
        })
      }
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
        if (typeof data !== 'string')
          throw new Error(`Invalid message type ${typeof data}`)

        return this.signEip191(addressEVM, data)
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
        if (!isTypedDataV1(data)) throw new Error('Invalid typed data v1')

        return this.signBlob(addressEVM, typedSignatureHash(data))
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        if (!isTypedData(data)) throw new Error('Invalid typed data')

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

  public async signBtcTransaction({
    accountIndex,
    transaction,
    provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    provider: BitcoinProvider
  }): Promise<string> {
    const btcNetwork = provider.getNetwork()
    const psbt = createPsbt(transaction.inputs, transaction.outputs, btcNetwork)
    const addressPublicKey = this.getAddressPublicKey(accountIndex)

    // Sign the inputs
    await Promise.all(
      psbt.txInputs.map((_, i) => {
        const signer = new SeedlessBtcSigner({
          fromKey: addressPublicKey,
          psbt,
          inputIndex: i,
          utxos: transaction.inputs,
          network: btcNetwork,
          client: this.#client
        })

        return psbt.signInputAsync(i, signer)
      })
    )

    // Validate inputs
    const areSignaturesValid = psbt.validateSignaturesOfAllInputs()

    if (!areSignaturesValid)
      throw new Error('Unable to sign Btc transaction: invalid signatures')

    // Finalize inputs
    psbt.finalizeAllInputs()

    return psbt.extractTransaction().toHex()
  }

  public async signAvalancheTransaction({
    accountIndex,
    transaction
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
  }): Promise<string> {
    const addressPublicKey = this.getAddressPublicKey(accountIndex)
    const isEvmTx = transaction.tx.getVM() === EVM

    const key = isEvmTx
      ? await this.getSigningKeyByTypeAndKey(cs.Secp256k1.Evm, addressPublicKey)
      : await this.getSigningKeyByTypeAndKey(cs.Secp256k1.Ava, addressPublicKey)

    const response = await this.#client.apiClient.signBlob(key.key_id, {
      message_base64: Buffer.from(sha256(transaction.tx.toBytes())).toString(
        'base64'
      )
    })

    transaction.tx.addSignature(utils.hexToBuffer(response.data().signature))

    return JSON.stringify(transaction.tx.toJSON())
  }

  public async signEvmTransaction({
    accountIndex,
    transaction,
    provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    const addressEVM = await this.getEvmAddress(accountIndex)

    const signer = new CsEthersSigner(addressEVM, this.#client, { provider })
    return signer.signTransaction(transaction)
  }

  public async getPublicKeyFor(path: string, curve: Curve): Promise<string> {
    const publicKey = this.#addressPublicKeys.find(findPublicKey(path, curve))

    if (!publicKey) {
      throw new Error(
        `Public key not found for path: ${path} and curve: ${curve}`
      )
    }

    return publicKey.key
  }

  public async getReadOnlyAvaSigner({
    accountIndex,
    provXP
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
  }): Promise<Avalanche.WalletVoid> {
    const addressPublicKey = this.getAddressPublicKey(accountIndex)
    const pubKeyEvm = await this.getSigningKeyByTypeAndKey(
      cs.Secp256k1.Evm,
      addressPublicKey
    )
    const pubKeyXP = await this.getSigningKeyByTypeAndKey(
      cs.Secp256k1.Ava,
      addressPublicKey
    )

    if (!pubKeyEvm || !pubKeyXP) {
      throw new Error('No public keys found for wallet')
    }

    const pubKeyBufferC = Buffer.from(pubKeyEvm.public_key, 'hex')
    const pubKeyBufferXP = Buffer.from(pubKeyXP.public_key, 'hex')

    return Avalanche.WalletVoid.fromPublicKey(
      pubKeyBufferXP,
      pubKeyBufferC,
      provXP
    )
  }

  private signAvalancheMessage = async ({
    accountIndex,
    message,
    provider
  }: {
    accountIndex: number
    message: string
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> => {
    const addressPublicKey = this.getAddressPublicKey(accountIndex)
    const addressAVM = provider
      .getAddress(Buffer.from(addressPublicKey, 'hex'), 'X')
      .slice(2) //

    const buffer = Buffer.from(
      strip0x(
        await this.signBlob(
          stripChainAddress(addressAVM),
          `0x${Avalanche.digestMessage(toUtf8(message)).toString('hex')}`
        )
      ),
      'hex'
    )
    return utils.base58check.encode(new Uint8Array(buffer))
  }

  private async getEvmAddress(accountIndex: number): Promise<string> {
    const addressPublicKey = this.getAddressPublicKey(accountIndex)

    // need to use lowercase address due to a bug in the cubist sdk
    // TODO remove toLowerCase when the bug is fixed
    return getEvmAddressFromPubKey(
      Buffer.from(addressPublicKey, 'hex')
    ).toLowerCase()
  }

  private getAddressPublicKey(accountIndex: number): string {
    const publicKeys = this.#addressPublicKeys.filter(isEvmPublicKey)

    if (
      accountIndex < 0 ||
      accountIndex >= publicKeys.length ||
      !publicKeys[accountIndex]
    ) {
      throw new Error('Invalid account index')
    }

    return publicKeys[accountIndex].key
  }
}
