import {
  Address,
  avaxSerial,
  BigIntPr,
  Id,
  Input,
  Int,
  OutputOwners,
  TransferInput,
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

export const getImportPUtxos = (
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

export const getExportPUtxos = (
  amt: bigint,
  assetId: string,
  utxoId: string
): Utxo<TransferInput> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(utxoId), new Int(0)),
    Id.fromString(assetId),
    new TransferInput(new BigIntPr(amt), Input.fromNative([0, 1]))
  )
