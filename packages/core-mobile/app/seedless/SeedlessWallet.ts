import { Network } from '@avalabs/chains-sdk'
import * as cs from '@cubist-dev/cubesigner-sdk'
import { PubKeyType } from 'services/wallet/types'
import { strip0x } from '@avalabs/utils-sdk'
import {
  JsonRpcApiProvider,
  TransactionRequest,
  getBytes,
  hashMessage
} from 'ethers'
import networkService from 'services/network/NetworkService'
import {
  Avalanche,
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  BlockCypherProvider,
  createPsbt,
  getEvmAddressFromPubKey
} from '@avalabs/wallets-sdk'
import { Transaction } from 'bitcoinjs-lib'
import { isBitcoinNetwork } from 'utils/network/isBitcoinNetwork'
import { sha256 } from '@noble/hashes/sha256'
import { hexToBuffer } from '@avalabs/avalanchejs-v2'
import {
  SignTypedDataVersion,
  TypedDataUtils,
  typedSignatureHash
} from '@metamask/eth-sig-util'
import { RpcMethod } from 'store/walletConnectV2'
import { SeedlessTokenStorage } from './SeedlessSessionStorage'
import { SeedlessBtcSigner } from './SeedlessBtcSigner'

class SeedlessWallet {
  #signerSession?: cs.SignerSession

  constructor(
    private network?: Network,
    private addressPublicKey?: PubKeyType
  ) {}

  async connect(): Promise<void> {
    this.#signerSession = await cs.CubeSigner.loadSignerSession()
  }

  static async auth(oidcToken: string): Promise<void> {
    const sessionTokenStorage = new SeedlessTokenStorage()
    const cubesigner = new cs.CubeSigner()

    await cubesigner.oidcAuth(
      oidcToken,
      process.env.SEEDLESS_ORG_ID || '',
      ['sign:*'],
      {
        // How long singing with a particular token works from the token creation
        auth_lifetime: 5 * 60, // 5 minutes
        // How long a refresh token is valid, the user has to unlock Core in this timeframe otherwise they will have to re-login
        // Sessions expire either if the session lifetime expires or if a refresh token expires before a new one is generated
        refresh_lifetime: 90 * 24 * 60 * 60, // 90 days
        // How long till the user absolutely must sign in again
        session_lifetime: 1 * 365 * 24 * 60 * 60 // 1 year
      },
      sessionTokenStorage
    )
  }

  async getPublicKeys(): Promise<PubKeyType[] | undefined> {
    // get keys and filter out non derived ones and group them
    const keys = (await this.#signerSession?.keys())
      ?.filter(
        k =>
          k.enabled &&
          ['SecpEthAddr', 'SecpAvaAddr'].includes(k.key_type) &&
          k.derivation_info?.derivation_path
      )
      .reduce((acc, key) => {
        if (!key.derivation_info) {
          return acc
        }

        const index = Number(
          key.derivation_info.derivation_path.split('/').pop()
        )
        if (index === undefined) {
          return acc
        }

        acc[key.derivation_info.mnemonic_id] = [
          ...(acc[key.derivation_info.mnemonic_id] ?? [])
        ]
        const mnemonicBlock = acc[key.derivation_info.mnemonic_id] || []

        mnemonicBlock[index] = {
          ...acc[key.derivation_info.mnemonic_id]?.[index],
          [key.key_type]: key
        }

        return acc
      }, {} as Record<string, Record<string, cs.KeyInfo>[]>)

    if (!keys || Object.keys(keys).length === 0) {
      throw new Error('Accounts not created')
    }

    const derivedKeys = Object.values(keys)[0]

    if (!derivedKeys) {
      throw new Error('Accounts keys missing')
    }

    const pubkeys = [] as PubKeyType[]

    for (let i = 0; i < derivedKeys.length; i++) {
      const key = derivedKeys[i]
      if (!key || !key.SecpAvaAddr || !key.SecpEthAddr) {
        break
      }
      pubkeys.push({
        evm: strip0x(key.SecpEthAddr.public_key),
        xp: strip0x(key.SecpAvaAddr.public_key)
      })
    }

    if (!pubkeys?.length) {
      throw new Error('Address not found')
    }

    return pubkeys
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.#signerSession) {
      throw new Error('SeedlessWallet not connected')
    }
    if (!this.addressPublicKey?.evm) {
      throw new Error('Wallet address not defined')
    }

    if (!this.network) {
      throw new Error('Network not defined')
    }
    const provider = networkService.getProviderForNetwork(this.network)

    if (!(provider instanceof JsonRpcApiProvider)) {
      throw new Error('Wallet address not defined')
    }

    const signer = new cs.ethers.Signer(
      getEvmAddressFromPubKey(Buffer.from(this.addressPublicKey.evm, 'hex')),
      this.#signerSession,
      provider
    )

    return signer.signTransaction(transaction)
  }

  async signTx(
    ins: BitcoinInputUTXO[],
    outs: BitcoinOutputUTXO[]
  ): Promise<Transaction> {
    if (!this.network || !isBitcoinNetwork(this.network)) {
      throw new Error(
        'Invalid network: Attempting to sign BTC transaction on non Bitcoin network'
      )
    }
    const provider = networkService.getProviderForNetwork(this.network)

    if (!(provider instanceof BlockCypherProvider)) {
      throw new Error('Unable to find provider')
    }
    const btcNetwork = provider.getNetwork()
    const psbt = createPsbt(ins, outs, btcNetwork)

    // Sign the inputs
    await Promise.all(
      psbt.txInputs.map((_, i) => {
        if (!this.#signerSession) {
          throw new Error('No signer session')
        }

        if (!this.addressPublicKey?.evm) {
          throw new Error('No address public key available')
        }

        const signer = new SeedlessBtcSigner(
          this.addressPublicKey.evm,
          psbt,
          i,
          ins,
          btcNetwork,
          this.#signerSession
        )
        // console.log(`Signing input ${i + 1} of ${psbt.inputCount}`)
        return psbt.signInputAsync(i, signer)
      })
    )

    // Validate inputs
    psbt.validateSignaturesOfAllInputs()
    // Finalize inputs
    psbt.finalizeAllInputs()
    return psbt.extractTransaction()
  }

  async signAvalancheTx(
    request: Avalanche.SignTxRequest
  ): Promise<Avalanche.SignTxRequest['tx']> {
    if (!this.#signerSession) {
      throw new Error('SeedlessWallet not connected')
    }
    if (!this.addressPublicKey?.xp) {
      throw new Error('Wallet address not defined')
    }
    if (!this.network) {
      throw new Error('Network not defined')
    }

    const isMainnet = !this.network.isTestnet
    const key = (await this.#signerSession.keys()).find(k =>
      request.tx.getVM() === 'EVM'
        ? k.key_type === cs.Secp256k1.Evm &&
          strip0x(k.publicKey) === this.addressPublicKey?.evm
        : k.key_type ===
            (isMainnet ? cs.Secp256k1.Ava : cs.Secp256k1.AvaTest) &&
          strip0x(k.publicKey) === this.addressPublicKey?.xp
    )

    if (!key) {
      throw new Error('Signing key not found')
    }
    const signatureResponse = await this.#signerSession.signBlob(key.key_id, {
      message_base64: Buffer.from(sha256(request.tx.toBytes())).toString(
        'base64'
      )
    })
    request.tx.addSignature(hexToBuffer(signatureResponse.data().signature))

    return request.tx
  }

  async signMessage(
    messageType: RpcMethod,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    network: Network
  ): Promise<string | Buffer> {
    if (!this.#signerSession) {
      throw new Error('SeedlessWallet not connected')
    }
    if (!this.addressPublicKey?.evm || !this.addressPublicKey?.xp) {
      throw new Error('Wallet address not defined')
    }

    const address = getEvmAddressFromPubKey(
      Buffer.from(this.addressPublicKey.evm, 'hex')
    ).toLowerCase()

    switch (messageType) {
      case RpcMethod.AVALANCHE_SIGN_MESSAGE:
        return Buffer.from(
          strip0x(
            await this.signBlob(
              networkService
                .getAvalancheProviderXP(!!network.isTestnet)
                .getAddress(Buffer.from(this.addressPublicKey.xp, 'hex'), 'X')
                .slice(2), // remove chain prefix
              `0x${Avalanche.digestMessage(data).toString('hex')}`
            )
          ),
          'hex'
        )
      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
        return this.signBlob(
          address,
          hashMessage(Buffer.from(strip0x(data), 'hex'))
        )
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
        return this.signBlob(address, typedSignatureHash(data))
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4:
        // Not using cs.ethers.Signer.signTypedData due to the strict type verification in Ethers
        // dApps in many cases have requests with extra unused types. In these cases ethers throws an error, rightfully.
        // However since MM supports these malformed messages, we have to as well. Otherwise Core would look broken.
        return this.signBlob(
          address,
          `0x${TypedDataUtils.eip712Hash(
            data,
            messageType === RpcMethod.SIGN_TYPED_DATA_V3
              ? SignTypedDataVersion.V3
              : SignTypedDataVersion.V4
          ).toString('hex')}`
        )

      default:
        throw new Error('unknown method')
    }
  }

  private async signBlob(address: string, digest: string): Promise<string> {
    if (!this.#signerSession) {
      throw new Error('SeedlessWallet not connected')
    }

    const blobReq = <cs.BlobSignRequest>{
      message_base64: Buffer.from(getBytes(digest)).toString('base64')
    }
    // Get the key corresponding to this address
    const key = (await this.#signerSession.keys()).find(
      k => k.material_id === address
    )
    if (key === undefined) {
      throw new Error(`Cannot access key '${address}'`)
    }

    const res = await this.#signerSession.signBlob(key.key_id, blobReq)
    return res.data().signature
  }
}

export default SeedlessWallet
