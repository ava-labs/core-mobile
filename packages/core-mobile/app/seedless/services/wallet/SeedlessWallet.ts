import { NetworkVMType } from '@avalabs/chains-sdk'
import * as cs from '@cubist-labs/cubesigner-sdk'
import { Signer as CsEthersSigner } from '@cubist-labs/cubesigner-sdk-ethers-v6'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  PubKeyType,
  Wallet
} from 'services/wallet/types'
import { strip0x } from '@avalabs/utils-sdk'
import { BytesLike, TransactionRequest, getBytes, hashMessage } from 'ethers'
import { networks } from 'bitcoinjs-lib'
import {
  Avalanche,
  BlockCypherProvider,
  JsonRpcBatchInternal,
  createPsbt,
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
import CoreSeedlessAPIService from '../CoreSeedlessAPIService'
import { SeedlessBtcSigner } from './SeedlessBtcSigner'

export default class SeedlessWallet implements Wallet {
  #session: cs.SignerSession
  #addressPublicKey: PubKeyType

  constructor(session: cs.SignerSession, addressPublicKey: PubKeyType) {
    this.#session = session
    this.#addressPublicKey = addressPublicKey
  }

  private async getMnemonicId(): Promise<string> {
    const keys = await this.#session.keys()

    const activeAccountKey = keys.find(
      key => strip0x(key.publicKey) === this.#addressPublicKey?.evm
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
    const keys = await this.#session.keys()

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

    const keys = await this.#session.keys()

    const key = keys
      .filter(({ key_type }) => key_type === type)
      .find(({ publicKey }) => strip0x(publicKey) === lookupPublicKey)

    if (!key) {
      throw new Error('Signing key not found')
    }

    return key
  }

  private getPubKeyBufferC(): Buffer {
    return Buffer.from(this.#addressPublicKey.evm, 'hex')
  }

  private getPubKeyBufferXP(): Buffer {
    if (!this.#addressPublicKey.xp)
      throw new Error('xp public key not available')

    return Buffer.from(this.#addressPublicKey.xp, 'hex')
  }

  private async signBlob(address: string, digest: BytesLike): Promise<string> {
    const blobReq = {
      message_base64: Buffer.from(getBytes(digest)).toString('base64')
    }

    const key = await this.getSigningKeyByAddress(address)

    const res = await this.#session.signBlob(key.key_id, blobReq)
    return res.data().signature
  }

  public async addAccount(accountIndex: number): Promise<void> {
    if (accountIndex < 1) {
      // To add a new account, we must already know at least one
      // public key to be able to find the mnemonic ID, which we'll use
      // to derive the next keys.
      throw new Error('Account index must be greater than or equal to 1')
    }

    const identityProof = await this.#session.proveIdentity()
    const mnemonicId = await this.getMnemonicId()

    await CoreSeedlessAPIService.addAccount({
      accountIndex,
      identityProof,
      mnemonicId
    })
  }

  /** WALLET INTERFACE IMPLEMENTATION **/
  public async signMessage({
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

  public async signBtcTransaction({
    transaction,
    provider
  }: {
    transaction: BtcTransactionRequest
    provider: BlockCypherProvider
  }): Promise<string> {
    const btcNetwork = provider.getNetwork()
    const psbt = createPsbt(transaction.inputs, transaction.outputs, btcNetwork)

    // Sign the inputs
    await Promise.all(
      psbt.txInputs.map((_, i) => {
        if (!this.#addressPublicKey) {
          throw new Error('Public key not available')
        }

        const signer = new SeedlessBtcSigner({
          fromKey: this.#addressPublicKey.evm,
          psbt,
          inputIndex: i,
          utxos: transaction.inputs,
          network: btcNetwork,
          session: this.#session
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
    transaction
  }: {
    transaction: AvalancheTransactionRequest
  }): Promise<string> {
    const isEvmTx = transaction.tx.getVM() === EVM

    const key = isEvmTx
      ? await this.getSigningKeyByTypeAndKey(
          cs.Secp256k1.Evm,
          this.#addressPublicKey.evm
        )
      : await this.getSigningKeyByTypeAndKey(
          cs.Secp256k1.Ava,
          this.#addressPublicKey.xp
        )

    const response = await this.#session.signBlob(key.key_id, {
      message_base64: Buffer.from(sha256(transaction.tx.toBytes())).toString(
        'base64'
      )
    })

    transaction.tx.addSignature(hexToBuffer(response.data().signature))

    return JSON.stringify(transaction.tx.toJSON())
  }

  public async signEvmTransaction({
    transaction,
    provider
  }: {
    transaction: TransactionRequest
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    const signer = new CsEthersSigner(
      getEvmAddressFromPubKey(this.getPubKeyBufferC()),
      this.#session,
      { provider }
    )
    return signer.signTransaction(transaction)
  }

  public async getPublicKey(): Promise<PubKeyType> {
    return this.#addressPublicKey
  }

  public getAddresses({
    isTestnet,
    provXP
  }: {
    isTestnet: boolean
    provXP: Avalanche.JsonRpcProvider
  }): Record<NetworkVMType, string> {
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

  public getReadOnlyAvaSigner({
    provXP
  }: {
    provXP: Avalanche.JsonRpcProvider
  }): Avalanche.WalletVoid {
    const pubKeyBufferC = this.getPubKeyBufferC()
    const pubKeyBufferXP = this.getPubKeyBufferXP()

    return Avalanche.WalletVoid.fromPublicKey(
      pubKeyBufferXP,
      pubKeyBufferC,
      provXP
    )
  }
}
