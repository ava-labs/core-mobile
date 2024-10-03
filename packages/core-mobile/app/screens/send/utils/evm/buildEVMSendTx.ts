import { JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TransactionRequest } from 'ethers'
import {
  NftTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20,
  TokenWithBalanceEVM
} from '@avalabs/vm-module-types'
import {
  ERC20__factory,
  ERC1155__factory,
  ERC721__factory
} from 'contracts/openzeppelin'

export const buildErc20Tx = async ({
  fromAddress,
  provider,
  toAddress,
  amount,
  token
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  toAddress: string
  amount: bigint
  token: TokenWithBalanceERC20
}): Promise<TransactionRequest> => {
  const erc20 = ERC20__factory.connect(token.address || '', provider)

  const populatedTransaction = await erc20.transfer.populateTransaction(
    toAddress,
    amount
  )
  const unsignedTx: TransactionRequest = {
    ...populatedTransaction, // only includes `to` and `data`
    chainId: populatedTransaction.chainId
      ? Number(populatedTransaction.chainId)
      : undefined,
    from: fromAddress
  }

  return unsignedTx
}

export const buildErc721Tx = async ({
  fromAddress,
  provider,
  toAddress,
  token
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  toAddress: string
  token: NftTokenWithBalance
}): Promise<TransactionRequest> => {
  const erc721 = ERC721__factory.connect(token.address || '', provider)

  const populatedTransaction = await erc721[
    'safeTransferFrom(address,address,uint256)'
  ].populateTransaction(fromAddress, toAddress, token.tokenId)

  const unsignedTx: TransactionRequest = {
    ...populatedTransaction,
    chainId: populatedTransaction.chainId
      ? Number(populatedTransaction.chainId)
      : undefined,
    from: fromAddress
  }
  return unsignedTx
}

export const buildErc1155Tx = async ({
  fromAddress,
  provider,
  toAddress,
  token
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  toAddress: string
  token: NftTokenWithBalance
}): Promise<TransactionRequest> => {
  const erc1155 = ERC1155__factory.connect(token.address || '', provider)

  const populatedTransaction =
    await erc1155.safeTransferFrom.populateTransaction(
      fromAddress,
      toAddress,
      token.tokenId,
      1,
      new Uint8Array()
    )

  const unsignedTx: TransactionRequest = {
    ...populatedTransaction,
    chainId: populatedTransaction.chainId
      ? Number(populatedTransaction.chainId)
      : undefined,
    from: fromAddress
  }

  return unsignedTx
}

export const buildNativeTx = (
  fromAddress: string,
  toAddress: string,
  amount: bigint
): TransactionRequest => ({
  from: fromAddress,
  to: toAddress,
  value: amount
})

export const buildTx = async ({
  fromAddress,
  provider,
  token,
  toAddress,
  amount
}: {
  fromAddress: string
  provider: JsonRpcBatchInternal
  token: TokenWithBalanceEVM
  toAddress: string
  amount?: bigint
}): Promise<TransactionRequest> => {
  if (amount !== undefined) {
    if (token.type === TokenType.NATIVE) {
      return buildNativeTx(fromAddress, toAddress, amount)
    }

    if (token.type === TokenType.ERC20) {
      return buildErc20Tx({
        fromAddress,
        provider,
        toAddress,
        amount,
        token
      })
    }
  }

  if (token.type === TokenType.ERC721) {
    return buildErc721Tx({
      fromAddress,
      provider,
      toAddress,
      token
    })
  }

  if (token.type === TokenType.ERC1155) {
    return buildErc1155Tx({
      fromAddress,
      provider,
      toAddress,
      token
    })
  }

  throw new Error(`Unknown send options object`)
}
