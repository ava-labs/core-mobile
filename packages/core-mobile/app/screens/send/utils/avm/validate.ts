import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { SendErrorMessage } from '../types'

export const validate = ({
  amount,
  address,
  maxFee,
  token
}: {
  amount: bigint | undefined
  address: string | undefined
  maxFee: bigint
  token: TokenWithBalanceAVM
}): void => {
  if (!address) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)

  const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

  const balance = token.available ?? 0n
  const maxAmountValue = balance - fee

  if (
    !Avalanche.isBech32Address(address, false) &&
    !Avalanche.isBech32Address(address, true)
  )
    throw new Error(SendErrorMessage.INVALID_ADDRESS)

  if (!maxFee || maxFee === 0n)
    throw new Error(SendErrorMessage.INVALID_NETWORK_FEE)

  if (balance <= fee)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)

  if (!amount || amount === 0n)
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)

  if (amount && amount > maxAmountValue)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
}
