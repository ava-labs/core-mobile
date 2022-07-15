import {
  NativeTransactionDto,
  Erc20TransferDetailsDto
} from '@avalabs/glacier-sdk'

export type HistoryTransactionType =
  | NativeTransactionDto
  | Erc20TransferDetailsDto

// export function isTransactionERC20(
//   tx: HistoryTransactionType
// ): tx is Erc20TransferDetailsDto {
//   return Object.prototype.hasOwnProperty.call(tx, 'erc20Token')
// }

// export function isTransactionNormal(
//   tx: HistoryTransactionType
// ): tx is NativeTransactionDto {
//   return Object.prototype.hasOwnProperty.call(tx, 'blockNumber')
// }
