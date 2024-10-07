import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { Amount } from 'types'
import { bigIntToString } from '@avalabs/core-utils-sdk'
import { GAS_LIMIT_FOR_XP_CHAIN } from 'consts/fees'
import { SendErrorMessage } from '../types'

export const validate = ({
  amount,
  address,
  maxFee,
  token,
  onCalculateMaxAmount
}: {
  amount: bigint
  address: string | undefined
  maxFee: bigint
  token: TokenWithBalancePVM
  onCalculateMaxAmount?: (maxAmount: Amount) => void
}): void => {
  if (!address) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)

  const fee = maxFee ? BigInt(GAS_LIMIT_FOR_XP_CHAIN) * maxFee : 0n

  const balance = token.balance
  const maxAmountValue = balance - fee
  const maxAmount = maxAmountValue > 0n ? maxAmountValue : 0n

  onCalculateMaxAmount?.({
    bn: maxAmount,
    amount: bigIntToString(maxAmount, token.decimals)
  })

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
