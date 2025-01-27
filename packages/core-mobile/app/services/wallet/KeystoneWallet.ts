import {
  Avalanche,
  BitcoinProvider,
  DerivationPath,
  JsonRpcBatchInternal,
  getAddressPublicKeyFromXPub,
  getAddressDerivationPath
} from '@avalabs/core-wallets-sdk'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  PubKeyType,
  Wallet
} from 'services/wallet/types'
import { TransactionRequest } from 'ethers'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import { WalletType } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { UR } from '@ngraveio/bc-ur'
import {
  AvalancheSignRequest,
  AvalancheSignature
} from '@keystonehq/bc-ur-registry-avalanche'
import { v4, parse } from 'uuid'
import { createPsbt } from '@avalabs/core-wallets-sdk'
import {
  CryptoPSBT,
  RegistryTypes,
  DataType,
  ETHSignature,
  EthSignRequest
} from '@keystonehq/bc-ur-registry-eth'
import { Psbt } from 'bitcoinjs-lib'
import { Common, Hardfork } from '@ethereumjs/common'
import {
  FeeMarketEIP1559Transaction,
  FeeMarketEIP1559TxData,
  LegacyTransaction
} from '@ethereumjs/tx'
import { makeBigIntLike } from 'utils/makeBigIntLike'
import { rlp } from 'ethereumjs-util'
import { BytesLike, AddressLike, BigIntLike } from '@ethereumjs/util'
import { URType } from '@keystonehq/animated-qr'
import { convertTxData } from './utils'

const throwUnsupportedMethodError = (method: string): never => {
  throw new Error(`Unsupported method: ${method}`)
}

const signer = async (
  requesrUR: UR,
  responseURTypes: string[],
  handleResult: (cbor: Buffer) => Promise<string>
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.KeystoneSigner,
        params: {
          requesrUR,
          responseURTypes,
          onReject: (message?: string) => {
            reject(message ?? 'User rejected')
          },
          onApprove: (cbor: Buffer) => {
            return handleResult(cbor).then(resolve).catch(reject)
          }
        }
      }
    })
  })
}

export class KeystoneWallet implements Wallet {
  /**
   * Derivation path: m/44'/60'/0'
   * @private
   */
  #xpub?: string

  /**
   * Derivation path: m/44'/9000'/0'
   * @private
   */
  #xpubXP?: string

  #mfp?: string

  static instance: KeystoneWallet

  public static getInstance(): KeystoneWallet {
    if (!KeystoneWallet.instance) {
      KeystoneWallet.instance = new KeystoneWallet()
    }

    return KeystoneWallet.instance
  }

  private async getAvaSigner(
    accountIndex: number,
    provider: Avalanche.JsonRpcProvider
  ): Promise<Avalanche.WalletVoid> {
    const keys = await this.getPublicKey(accountIndex)
    return Avalanche.StaticSigner.fromPublicKey(
      Buffer.from(keys.xp!, 'hex'),
      Buffer.from(keys.evm, 'hex'),
      provider
    )
  }

  public get xpub(): string {
    assertNotUndefined(this.#xpub, 'no public key (xpub) available')
    return this.#xpub
  }

  public set xpub(xpub: string | undefined) {
    this.#xpub = xpub
  }

  public get xpubXP(): string {
    assertNotUndefined(this.#xpubXP, 'no public key (xpubXP) available')
    return this.#xpubXP
  }

  public set xpubXP(xpubXP: string | undefined) {
    this.#xpubXP = xpubXP
  }

  public get mfp(): string {
    assertNotUndefined(this.#mfp, 'no master fingerprint available')
    return this.#mfp
  }

  public set mfp(mfp: string | undefined) {
    this.#mfp = mfp
  }

  /** WALLET INTERFACE IMPLEMENTATION **/
  public async signMessage(): Promise<string> {
    throwUnsupportedMethodError('signMessage')
    return ''
  }

  public async signBtcTransaction({
    accountIndex,
    transaction,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    network,
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

    const requestId = Buffer.from(parse(v4()) as Uint8Array)
    const requestUR = AvalancheSignRequest.constructAvalancheRequest(
      Buffer.from(tx.toBytes()),
      this.mfp,
      isEvmChain ? this.xpub : this.xpubXP,
      accountIndex,
      requestId
    ).toUR()

    return await signer(requestUR, ['avax-signature'], cbor => {
      const response = AvalancheSignature.fromCBOR(cbor)
      const sig = response.getSignature()
      tx.addSignature(sig)
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
    signature?: { r: BigIntLike; s: BigIntLike; v: BigIntLike }
  ): Promise<LegacyTransaction | FeeMarketEIP1559Transaction> {
    return typeof txRequest.gasPrice !== 'undefined'
      ? LegacyTransaction.fromTxData(
          {
            ...convertTxData(txRequest),
            ...signature
          },
          {
            common: Common.custom({
              chainId: Number(txRequest.chainId)
            })
          }
        )
      : FeeMarketEIP1559Transaction.fromTxData(
          { ...this.txRequestToFeeMarketTxData(txRequest), ...signature },
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
      Buffer.from(message),
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
        const signature = ETHSignature.fromCBOR(cbor).getSignature()

        const r = makeBigIntLike(
          Buffer.from(signature.slice(0, 32)).toString('hex')
        )!
        const s = makeBigIntLike(
          Buffer.from(signature.slice(32, 64)).toString('hex')
        )!
        const v = signature.slice(64)

        const signedTx = await this.getTxFromTransactionRequest(transaction, {
          r,
          s,
          v
        })

        return '0x' + signedTx.serialize().toString()
      }
    )
  }

  public async getPublicKey(accountIndex: number): Promise<PubKeyType> {
    const evmPub = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    const xpPub = Avalanche.getAddressPublicKeyFromXpub(
      this.xpubXP,
      accountIndex
    )

    return {
      evm: evmPub.toString('hex'),
      xp: xpPub.toString('hex')
    }
  }

  public async getAddresses({
    accountIndex,
    provXP,
    network
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
    network: Network
  }): Promise<Record<NetworkVMType, string>> {
    const addresses = await ModuleManager.getAddresses({
      walletType: WalletType.Keystone,
      accountIndex,
      xpub: this.xpub,
      xpubXP: this.xpubXP,
      network
    })

    // C-avax... this address uses the same public key as EVM
    const cPubKey = getAddressPublicKeyFromXPub(this.xpub, accountIndex)
    const cAddr = provXP.getAddress(cPubKey, 'C')

    return {
      ...(addresses as Record<NetworkVMType, string>),
      [NetworkVMType.CoreEth]: cAddr
    }
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
}

export default KeystoneWallet.getInstance()
