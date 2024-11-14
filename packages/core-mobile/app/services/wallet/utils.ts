import {
  Address,
  avaxSerial,
  BigIntPr,
  Id,
  Int,
  OutputOwners,
  pvmSerial,
  TransferOutput,
  Utxo
} from '@avalabs/avalanchejs'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest
} from './types'

export const isBtcTransactionRequest = (
  request: SignTransactionRequest
): request is BtcTransactionRequest => {
  return 'inputs' in request
}

export const isAvalancheTransactionRequest = (
  request: SignTransactionRequest
): request is AvalancheTransactionRequest => {
  return 'tx' in request
}

export const getTransferOutputUtxos = (
  amt: bigint,
  assetId: string,
  address: string,
  utxoId: string
  // eslint-disable-next-line max-params
): Utxo<TransferOutput> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(utxoId), new Int(0)),
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amt),
      OutputOwners.fromNative([Address.fromString(address).toBytes()])
    )
  )

export const getStakeableOutUtxos = (
  amt: bigint,
  assetId: string,
  address: string,
  utxoId: string
  // eslint-disable-next-line max-params
): Utxo<pvmSerial.StakeableLockOut> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(utxoId), new Int(0)),
    Id.fromString(assetId),
    new pvmSerial.StakeableLockOut(
      new BigIntPr(0n),
      new TransferOutput(
        new BigIntPr(amt),
        OutputOwners.fromNative([Address.fromString(address).toBytes()])
      )
    )
  )
