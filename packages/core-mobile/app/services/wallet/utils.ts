import { AvalancheTxParams } from 'store/rpc/handlers/avalanche_sendTransaction/avalanche_sendTransaction'
import {
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SignTransactionRequest
} from './types'

export const isBtcTransactionRequest = (
  request: SignTransactionRequest | AvalancheTxParams
): request is BtcTransactionRequest => {
  return 'inputs' in request
}

export const isAvalancheTransactionRequest = (
  request: SignTransactionRequest | AvalancheTxParams
): request is AvalancheTransactionRequest => {
  return 'tx' in request
}

export const isAvalancheTxParams = (
  request: SignTransactionRequest | AvalancheTxParams
): request is AvalancheTxParams => {
  return 'chainAlias' in request
}
