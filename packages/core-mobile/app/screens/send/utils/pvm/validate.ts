import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { SendErrorMessage } from '../types'

export const validate = ({
  amount,
  address,
  maxFee,
  token,
  estimatedFee,
  gasPrice
}: {
  amount: bigint
  address: string | undefined
  maxFee: bigint
  token: TokenWithBalancePVM
  estimatedFee?: bigint
  gasPrice?: bigint
}): void => {
  if (!address) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
  // TODO: use correct gas limit for P-chain
  const fee = estimatedFee ?? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee

  const balance = token.available ?? 0n
  const maxAmountValue = balance - fee

  if (
    !Avalanche.isBech32Address(address, false) &&
    !Avalanche.isBech32Address(address, true)
  )
    throw new Error(SendErrorMessage.INVALID_ADDRESS)

  if (!maxFee || maxFee === 0n || (gasPrice && gasPrice < maxFee))
    throw new Error(SendErrorMessage.INVALID_NETWORK_FEE)

  if (balance <= fee)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)

  if (gasPrice && gasPrice > maxFee * 2n) {
    throw new Error(SendErrorMessage.EXCESSIVE_NETWORK_FEE)
  }

  if (!amount || amount === 0n)
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)

  if (amount && amount > maxAmountValue)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
}
