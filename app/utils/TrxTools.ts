import { ERC20Asset } from '@avalabs/bridge-sdk/src/types'
import { Blockchain } from '@avalabs/bridge-sdk'
import { TxType } from 'screens/shared/ActivityList'
import {
  TransactionERC20,
  TransactionNormal
} from '@avalabs/wallet-react-components'

export function isBridge(
  tx: TxType,
  bridgeAssets?: Record<string, ERC20Asset>
) {
  if (!bridgeAssets) return false
  const ercNormalTx = tx as TransactionNormal | TransactionERC20
  if ('requiredConfirmationCount' in tx) {
    return (
      Object.values(bridgeAssets).filter(
        el =>
          (el.nativeNetwork === Blockchain.AVALANCHE &&
            el.nativeContractAddress?.toLowerCase() ===
              ercNormalTx.contractAddress?.toLowerCase()) ||
          el.wrappedContractAddress?.toLowerCase() ===
            ercNormalTx.contractAddress?.toLowerCase() ||
          ercNormalTx?.to === '0x0000000000000000000000000000000000000000' ||
          ercNormalTx?.from === '0x0000000000000000000000000000000000000000'
      ).length > 0
    )
  } else {
    return false
  }
}

export function isIncoming(tx: TxType) {
  if ('isSender' in tx) {
    return !tx.isSender
  }
  return false
}

export function isOutgoing(tx: TxType) {
  if ('isSender' in tx) {
    return tx.isSender
  }
  return false
}

export function isContractCall(tx: TxType) {
  if ('input' in tx) {
    return tx.input !== '0x'
  }
  return false
}
