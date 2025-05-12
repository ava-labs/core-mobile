import { isBtcAddress } from 'utils/isBtcAddress'
import { SendErrorMessage } from '../types'

export const validate = ({
  toAddress,
  isMainnet,
  amount,
  maxFee,
  maxAmount
}: {
  toAddress: string
  isMainnet: boolean
  amount: bigint
  maxFee: bigint
  maxAmount: bigint
}): void => {
  if (maxFee === 0n) throw new Error(SendErrorMessage.INVALID_NETWORK_FEE)

  // Validate the destination address
  const isAddressValid = isBtcAddress(toAddress, isMainnet)

  if (!isAddressValid) throw new Error(SendErrorMessage.INVALID_ADDRESS)

  if (!amount || amount <= 0n) {
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
  }

  if (amount > maxAmount) throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
}
