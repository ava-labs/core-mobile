import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  Wallet
} from 'services/wallet/types'
import {
  TypedDataV1,
  TypedData,
  MessageTypes,
  RpcMethod
} from '@avalabs/vm-module-types'
import { Curve } from 'utils/publicKeys'
import { assertNotUndefined } from 'utils/assertions'
import {
  Avalanche,
  BitcoinProvider,
  createPsbt,
  DerivationPath,
  getAddressDerivationPath,
  getAddressPublicKeyFromXPub,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  CryptoPSBT,
  RegistryTypes,
  DataType,
  ETHSignature,
  EthSignRequest
} from '@keystonehq/bc-ur-registry-eth'
import { Common, Hardfork } from '@ethereumjs/common'
import {
  AvalancheSignRequest,
  AvalancheSignature
} from '@keystonehq/bc-ur-registry-avalanche'
import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
  LegacyTransaction
} from '@ethereumjs/tx'
import { UR } from '@ngraveio/bc-ur'
import { rlp } from 'ethereumjs-util'
import { KeystoneDataStorageType } from 'hardware/storage/KeystoneDataStorage'
import { Network } from '@avalabs/core-chains-sdk'
import { Psbt } from 'bitcoinjs-lib'
import { v4 } from 'uuid'
import { hexlify, Signature, TransactionRequest } from 'ethers'
import { URType } from '@keystonehq/animated-qr'
import { BytesLike, AddressLike } from '@ethereumjs/util'
import { BN } from 'bn.js'
import { isTypedData } from '@avalabs/evm-module'
import { convertTxData, makeBigIntLike } from './utils'
import { signer } from './keystoneSigner'

export const EVM_DERIVATION_PATH = `m/44'/60'/0'`
export const AVAX_DERIVATION_PATH = `m/44'/9000'/0'`

export default class KeystoneWallet implements Wallet {
  #mfp: string
  #xpub: string
  #xpubXP: string

  constructor(keystoneData: KeystoneDataStorageType) {
    this.#mfp = keystoneData.mfp
    this.#xpub = keystoneData.evm
    this.#xpubXP = keystoneData.xp
  }

  public get xpub(): string {
    assertNotUndefined(this.#xpub, 'no public key (xpub) available')
    return this.#xpub
  }

  public get xpubXP(): string {
    assertNotUndefined(this.#xpubXP, 'no public key (xpubXP) available')
    return this.#xpubXP
  }

  public get mfp(): string {
    assertNotUndefined(this.#mfp, 'no master fingerprint available')
    return this.#mfp
  }

  public async signSvmTransaction(): Promise<string> {
    throw new Error('signSvmTransaction not implemented')
  }

  private async deriveEthSignature(cbor: Buffer): Promise<{
    r: string
    s: string
    v: number
  }> {
    const signature: any = ETHSignature.fromCBOR(cbor).getSignature()
    const r = hexlify(new Uint8Array(signature.slice(0, 32)))
    const s = hexlify(new Uint8Array(signature.slice(32, 64)))
    const v = new BN(signature.slice(64)).toNumber()
    return { r, s, v }
  }

  public async signMessage({
    rpcMethod,
    data,
    accountIndex
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    switch (rpcMethod) {
      case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
        throw new Error(
          '[KeystoneWallet-signMessage] AVALANCHE_SIGN_MESSAGE not implemented.'
        )
      }
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN: {
        if (typeof data !== 'string')
          throw new Error(`Invalid message type ${typeof data}`)

        const ur = EthSignRequest.constructETHRequest(
          Buffer.from(data.replace('0x', ''), 'hex'),
          DataType.personalMessage,
          `M/44'/60'/0'/0/${accountIndex}`,
          this.mfp,
          crypto.randomUUID()
        ).toUR()

        return await signer(
          ur,
          [URType.ETH_SIGNATURE, URType.EVM_SIGNATURE],
          async cbor => {
            const sig = await this.deriveEthSignature(cbor)

            return Signature.from(sig).serialized
          }
        )
      }
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1: {
        throw new Error(
          '[KeystoneWallet-signMessage] SIGN_TYPED_DATA/SIGN_TYPED_DATA_V1 not implemented.'
        )
      }
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        if (!isTypedData(data)) throw new Error('Invalid typed data')

        const ur = EthSignRequest.constructETHRequest(
          Buffer.from(JSON.stringify(data), 'utf-8'),
          DataType.typedData,
          `M/44'/60'/0'/0/${accountIndex}`,
          this.mfp,
          crypto.randomUUID()
        ).toUR()

        return await signer(
          ur,
          [URType.ETH_SIGNATURE, URType.EVM_SIGNATURE],
          async cbor => {
            const sig = await this.deriveEthSignature(cbor)

            return Signature.from(sig).serialized
          }
        )
      }
      default:
        throw new Error('unknown method')
    }
  }

  public async signBtcTransaction({
    accountIndex,
    transaction,
    provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
  }): Promise<string> {
    const { inputs, outputs } = transaction
    const psbt = createPsbt(inputs, outputs, provider.getNetwork())

    inputs.forEach((_, index) => {
      psbt.updateInput(index, {
        bip32Derivation: [
          {
            masterFingerprint: Buffer.from(this.mfp, 'hex'),
            pubkey: getAddressPublicKeyFromXPub(this.xpub, accountIndex),
            path: getAddressDerivationPath(
              accountIndex,
              DerivationPath.BIP44,
              'EVM'
            )
          }
        ]
      })
    })

    const cryptoPSBT = new CryptoPSBT(psbt.toBuffer())
    const ur = cryptoPSBT.toUR()

    return await signer(ur, [RegistryTypes.CRYPTO_PSBT.getType()], cbor => {
      const signedTx = CryptoPSBT.fromCBOR(cbor).getPSBT()
      return Promise.resolve(
        Psbt.fromBuffer(signedTx)
          .finalizeAllInputs()
          .extractTransaction()
          .toHex()
      )
    })
  }

  public async signAvalancheTransaction({
    accountIndex,
    transaction
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> {
    const tx = transaction.tx
    const isEvmChain = tx.getVM() === 'EVM'

    const requestUR = AvalancheSignRequest.constructAvalancheRequest(
      Buffer.from(tx.toBytes()),
      this.mfp,
      isEvmChain ? this.xpub : this.xpubXP,
      accountIndex
    ).toUR()

    return await signer(requestUR, ['avax-signature'], cbor => {
      const response = AvalancheSignature.fromCBOR(cbor)
      const sig = response.getSignature()
      tx.addSignature(sig as any)
      return Promise.resolve(JSON.stringify(tx.toJSON()))
    })
  }

  private txRequestToFeeMarketTxData(
    txRequest: TransactionRequest
  ): FeeMarketEIP1559TxData {
    const {
      to,
      nonce,
      gasLimit,
      value,
      data,
      type,
      maxFeePerGas,
      maxPriorityFeePerGas
    } = txRequest

    return {
      to: (to?.toString() || undefined) as AddressLike,
      nonce: makeBigIntLike(nonce),
      maxFeePerGas: makeBigIntLike(maxFeePerGas),
      maxPriorityFeePerGas: makeBigIntLike(maxPriorityFeePerGas),
      gasLimit: makeBigIntLike(gasLimit),
      value: makeBigIntLike(value),
      data: data as BytesLike,
      type: type || undefined
    }
  }

  private async getTxFromTransactionRequest(
    txRequest: TransactionRequest,
    signature?: { r: string; s: string; v: number }
  ): Promise<LegacyTransaction | FeeMarketEIP1559Transaction> {
    const _signature = signature
      ? {
          r: makeBigIntLike(signature.r),
          s: makeBigIntLike(signature.s),
          v: makeBigIntLike(signature.v)
        }
      : {}
    return typeof txRequest.gasPrice !== 'undefined'
      ? LegacyTransaction.fromTxData(
          {
            ...convertTxData(txRequest),
            ..._signature
          },
          {
            common: Common.custom({
              chainId: Number(txRequest.chainId)
            })
          }
        )
      : FeeMarketEIP1559Transaction.fromTxData(
          { ...this.txRequestToFeeMarketTxData(txRequest), ..._signature },
          {
            common: Common.custom(
              { chainId: Number(txRequest.chainId) },
              {
                // "London" hardfork introduced EIP-1559 proposal. Setting it here allows us
                // to use the new TX props (maxFeePerGas and maxPriorityFeePerGas) in combination
                // with the custom chainId.
                hardfork: Hardfork.London
              }
            )
          }
        )
  }

  private async buildSignatureUR(
    txRequest: TransactionRequest,
    fingerprint: string,
    activeAccountIndex: number
  ): Promise<UR> {
    const chainId = txRequest.chainId
    const isLegacyTx = typeof txRequest.gasPrice !== 'undefined'

    const tx = await this.getTxFromTransactionRequest(txRequest)

    const message =
      tx instanceof FeeMarketEIP1559Transaction
        ? tx.getMessageToSign()
        : rlp.encode(tx.getMessageToSign()) // Legacy transactions are not RLP-encoded

    const dataType = isLegacyTx
      ? DataType.transaction
      : DataType.typedTransaction

    // The keyPath below will depend on how the user onboards and should come from WalletService probably,
    // based on activeAccount.index, or fetched based on the address passed in params.from.
    // This here is BIP44 for the first account (index 0). 2nd account should be M/44'/60'/0'/0/1, etc..
    const keyPath = `M/44'/60'/0'/0/${activeAccountIndex}`
    const ethSignRequest = EthSignRequest.constructETHRequest(
      Buffer.from(message as any),
      dataType,
      keyPath,
      fingerprint,
      v4(),
      Number(chainId)
    )

    return ethSignRequest.toUR()
  }

  public async signEvmTransaction({
    accountIndex,
    transaction
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    const ur = await this.buildSignatureUR(transaction, this.mfp, accountIndex)

    return await signer(
      ur,
      [URType.ETH_SIGNATURE, URType.EVM_SIGNATURE],
      async cbor => {
        const sig = await this.deriveEthSignature(cbor)

        const signedTx = await this.getTxFromTransactionRequest(
          transaction,
          sig
        )

        return '0x' + Buffer.from(signedTx.serialize()).toString('hex')
      }
    )
  }

  private async getAvaSigner(
    accountIndex: number,
    provider: Avalanche.JsonRpcProvider
  ): Promise<Avalanche.WalletVoid> {
    const evmPub = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    const xpPub = Avalanche.getAddressPublicKeyFromXpub(
      this.xpubXP,
      accountIndex
    )
    return Avalanche.StaticSigner.fromPublicKey(xpPub, evmPub, provider)
  }

  public async getReadOnlyAvaSigner({
    accountIndex,
    provXP
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
  }): Promise<Avalanche.StaticSigner> {
    return (await this.getAvaSigner(
      accountIndex,
      provXP
    )) as Avalanche.StaticSigner
  }

  private getPublicKey(path: string): Buffer {
    const accountIndex = this.getAccountIndex(path)

    if (path.startsWith(EVM_DERIVATION_PATH)) {
      return getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    }
    if (path.startsWith(AVAX_DERIVATION_PATH)) {
      return Avalanche.getAddressPublicKeyFromXpub(this.xpubXP, accountIndex)
    }
    throw new Error(`Unknown path: ${path}`)
  }

  private getAccountIndex(path: string): number {
    const accountIndex = path.split('/').pop()
    if (!accountIndex) {
      throw new Error(`Invalid path: ${path}`)
    }
    return Number(accountIndex)
  }

  public async getPublicKeyFor({
    derivationPath,
    curve
  }: {
    derivationPath?: string
    curve: Curve
  }): Promise<string> {
    if (curve === Curve.ED25519) {
      throw new Error(`ED25519 not supported for path: ${derivationPath}`)
    }
    if (!derivationPath) {
      throw new Error(`Path is required for curve: ${curve}`)
    }
    const publicKey = this.getPublicKey(derivationPath).toString('hex')

    if (!publicKey) {
      throw new Error(
        `Public key not found for path: ${derivationPath} and curve: ${curve}`
      )
    }

    return publicKey
  }
}
