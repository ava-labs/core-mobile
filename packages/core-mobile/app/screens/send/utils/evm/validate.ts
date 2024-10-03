import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20,
  TokenWithBalanceEVM
} from '@avalabs/vm-module-types'
import { isAddress } from 'ethers'
import { Amount } from 'types'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import { SendErrorMessage } from '../types'

export const validateBasicInputs = (
  token: TokenWithBalanceEVM | undefined,
  toAddress: string | undefined,
  maxFee: bigint
): void => {
  if (!toAddress) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
  if (!isAddress(toAddress)) throw new Error(SendErrorMessage.INVALID_ADDRESS)
  if (!maxFee || maxFee === 0n)
    throw new Error(SendErrorMessage.INVALID_NETWORK_FEE)
  if (!token) throw new Error(SendErrorMessage.TOKEN_REQUIRED)
}

export const validateERC721 = (nativeToken: NetworkTokenWithBalance): void => {
  if (nativeToken.balance === 0n)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
}

export const validateERC1155 = (
  token: TokenWithBalanceEVM,
  nativeToken: NetworkTokenWithBalance
): void => {
  // TODO: uncomment this after migrating vm-module's nft balance fetching
  // https://ava-labs.atlassian.net/browse/CP-9276
  // if (token.balance === 0n) {
  //   throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
  // }

  if (nativeToken.balance === 0n) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
  }
}

export const validateAmount = ({
  gasLimit,
  amount,
  token,
  maxFee,
  nativeToken,
  onCalculateMaxAmount
}: {
  gasLimit: bigint
  amount: bigint | undefined
  token: TokenWithBalanceERC20 | NetworkTokenWithBalance
  maxFee: bigint
  nativeToken: NetworkTokenWithBalance
  onCalculateMaxAmount?: (maxAmount: Amount) => void
}): void => {
  if (amount && token.balance < amount) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
  }

  const totalFee = gasLimit * maxFee
  const remainingBalance = nativeToken.balance - (amount ?? 0n)
  const maxAmountValue = nativeToken.balance - totalFee

  if (token.type === TokenType.NATIVE) {
    onCalculateMaxAmount?.({
      bn: maxAmountValue ?? 0n,
      amount: maxAmountValue
        ? bigIntToString(maxAmountValue, nativeToken.decimals)
        : ''
    })

    if (remainingBalance < totalFee) {
      throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
    }
  } else if (token.type === TokenType.ERC20) {
    onCalculateMaxAmount?.({
      bn: token.balance,
      amount: bigIntToString(token.balance, token.decimals)
    })
  }

  if (!amount || (amount && amount <= 0n)) {
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
  }
}

export const validateGasLimit = (gasLimit: bigint): void => {
  if (gasLimit === 0n) {
    throw new Error(SendErrorMessage.INVALID_GAS_LIMIT)
  }
}

export const validateSupportedToken = (token: TokenWithBalanceEVM): void => {
  if (
    token.type !== TokenType.ERC20 &&
    token.type !== TokenType.ERC721 &&
    token.type !== TokenType.ERC1155 &&
    token.type !== TokenType.NATIVE
  ) {
    throw new Error(SendErrorMessage.UNSUPPORTED_TOKEN)
  }
}
