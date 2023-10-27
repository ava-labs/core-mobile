import { strip0x } from '@avalabs/utils-sdk'
import { BitcoinInputUTXO, getBtcAddressFromPubKey } from '@avalabs/wallets-sdk'
import { SignerSession } from '@cubist-dev/cubesigner-sdk'
import { Network, Psbt, SignerAsync, payments } from 'bitcoinjs-lib'
import { TransactionOutput } from 'bitcoinjs-lib/src/psbt'

/**
 * Implements `SignerAsync` interface from 'bitcoinjs-lib' for a given wallet.
 */
export class SeedlessBtcSigner implements SignerAsync {
  /** public key of sender address */
  readonly #fromKey: string
  /** partially signed tx */
  readonly #psbt: Psbt
  /** Index of the transaction input (in `this.psbt`) to sign */
  readonly #inputIndex: number
  /** Unspent output corresponding to that input */
  readonly #utxos: BitcoinInputUTXO[]
  /** Compressed pubkey of the wallet/key (`this.#keyInfo`) to sign with */
  public readonly publicKey: Buffer
  /** Bitcoin network to sign for */
  public readonly network: Network

  readonly #signerSession: SignerSession

  /** Public wallet. */
  get address(): string {
    return getBtcAddressFromPubKey(
      Buffer.from(this.#fromKey, 'hex'),
      this.network
    )
  }

  /**
   * Constructor.
   * @param {cs.KeyInfo} fromKey key on whose behalf to sign
   * @param {bc.Psbt} psbt Partially signed bitcoin transaction
   * @param {number} inputIndex Index of the transaction input to sign
   * @param {Utxo[]} utxos Unspent outputs corresponding to transaction intputs
   * @param {bc.networks.Network} network Bitcoin network
   * @param {cs.SignerSession} signerSession cubesigner signer session
   */
  constructor(
    fromKey: string,
    psbt: Psbt,
    inputIndex: number,
    utxos: BitcoinInputUTXO[],
    network: Network,
    signerSession: SignerSession
  ) {
    this.#fromKey = fromKey
    this.#psbt = psbt
    this.#inputIndex = inputIndex
    this.#utxos = utxos
    this.#signerSession = signerSession
    this.network = network

    const pk = Buffer.from(strip0x(fromKey), 'hex') // uncompressed
    if (pk.length !== 65 || pk[0] !== 4) {
      throw new Error('Invalid public key')
    }

    // compress it because that's what bitcoinjs wants
    // eslint-disable-next-line no-bitwise
    const parity = (pk[64] ?? 0) & 1
    this.publicKey = pk.subarray(0, 33)
    // eslint-disable-next-line no-bitwise
    this.publicKey[0] = 2 | parity
  }

  /** @inheritdoc */
  public async sign(/* _hash: Buffer*/): Promise<Buffer> {
    // translate psbt to the transaction needed for the RPC call
    const txInput = this.#psbt.txInputs[this.#inputIndex]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx: any = <any>{
      version: this.#psbt.version,
      lock_time: this.#psbt.locktime,
      input: this.#utxos.map(utxo => {
        return {
          script_sig: '', // always empty
          witness: [], // always empty
          // don't use `txInput.hash` for `txid` because even though those two started
          // out being the same, by now bitcoinjs has reversed `txInput.hash` (know knows why)
          previous_output: `${utxo.txHash}:${utxo.index}`,
          sequence: txInput?.sequence
        }
      }),
      output: this.#psbt.txOutputs.map((txO: TransactionOutput) => {
        return {
          value: txO.value,
          script_pubkey: txO.script.toString('hex')
        }
      })
    }

    // construct RPC request
    const paymentScript = payments.p2pkh({
      pubkey: this.publicKey,
      network: this.network
    }).output

    if (!paymentScript) {
      throw new Error('Unable to create p2pkh')
    }

    const resp = await this.#signerSession.signBtc(this.address, {
      sig_kind: {
        Segwit: {
          input_index: this.#inputIndex,
          script_code: `0x${paymentScript.toString('hex')}`,
          value: this.#utxos[this.#inputIndex]?.value ?? 0,
          sighash_type: 'All'
        }
      },
      tx: tx
    })

    const signature = resp.data().signature
    const sigBytes = Buffer.from(strip0x(signature), 'hex')

    if (sigBytes.length !== 65) {
      throw new Error(`Unexpected signature length: ${sigBytes.length}`)
    }
    // bitcoinjs insists on getting just the first 64 bytes (without the recovery byte)
    return sigBytes.subarray(0, 64)
  }

  /** @inheritdoc */
  public getPublicKey(): Buffer {
    return this.publicKey
  }

  /** @inheritdoc */
  public async signSchnorr(): Promise<Buffer> {
    throw new Error('Unsupported: No Schnorr signatures.')
  }
}
