import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalance,
  TokenWithBalanceERC20,
  TokenWithBalanceEVM
} from '@avalabs/vm-module-types'
import { isAddress } from 'ethers'
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
  if (token.balance === 0n) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
  }

  if (nativeToken.balance === 0n) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
  }
}

export const validateAmount = ({
  amount,
  token
}: {
  amount: bigint | undefined
  token: TokenWithBalanceERC20 | NetworkTokenWithBalance
}): void => {
  if (amount && token.balance < amount) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
  }

  if (!amount || (amount && amount <= 0n)) {
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
  }
}

export const validateFee = ({
  gasLimit,
  maxFee,
  amount,
  nativeToken,
  token
}: {
  gasLimit: bigint
  maxFee: bigint
  amount: bigint | undefined
  nativeToken: NetworkTokenWithBalance
  token: TokenWithBalanceEVM
}): void => {
  const totalFee = gasLimit * maxFee
  const remainingBalance = nativeToken.balance - (amount ?? 0n)

  if (token.type === TokenType.NATIVE && remainingBalance < totalFee) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
  }
}

export const validateGasLimit = (gasLimit: bigint): void => {
  if (gasLimit === 0n) {
    throw new Error(SendErrorMessage.INVALID_GAS_LIMIT)
  }
}

export function validateSupportedToken(
  token: TokenWithBalance
): asserts token is TokenWithBalanceEVM {
  if (
    token.type !== TokenType.ERC20 &&
    token.type !== TokenType.ERC721 &&
    token.type !== TokenType.ERC1155 &&
    token.type !== TokenType.NATIVE
  ) {
    throw new Error(SendErrorMessage.UNSUPPORTED_TOKEN)
  }
}
