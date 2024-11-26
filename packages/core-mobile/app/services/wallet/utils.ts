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
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isDevnet } from 'utils/isDevnet'
import { Network } from '@avalabs/core-chains-sdk'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest
} from './types'

export const MAINNET_AVAX_ASSET_ID = Avalanche.MainnetContext.avaxAssetID
export const TESTNET_AVAX_ASSET_ID = Avalanche.FujiContext.avaxAssetID
export const DEVNET_AVAX_ASSET_ID = Avalanche.DevnetContext.avaxAssetID

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

export const getTransferOutputUtxos = ({
  amt,
  assetId,
  address,
  utxoId
}: {
  amt: bigint
  assetId: string
  address: string
  utxoId: string
}): Utxo<TransferOutput> =>
  new Utxo(
    new avaxSerial.UTXOID(Id.fromString(utxoId), new Int(0)),
    Id.fromString(assetId),
    new TransferOutput(
      new BigIntPr(amt),
      OutputOwners.fromNative([Address.fromString(address).toBytes()])
    )
  )

export const getStakeableOutUtxos = ({
  amt,
  address,
  assetId,
  utxoId
}: {
  amt: bigint
  assetId: string
  address: string
  utxoId: string
}): Utxo<pvmSerial.StakeableLockOut> =>
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

export const getAssetId = (avaxXPNetwork: Network): string => {
  return isDevnet(avaxXPNetwork)
    ? DEVNET_AVAX_ASSET_ID
    : avaxXPNetwork.isTestnet
    ? TESTNET_AVAX_ASSET_ID
    : MAINNET_AVAX_ASSET_ID
}
