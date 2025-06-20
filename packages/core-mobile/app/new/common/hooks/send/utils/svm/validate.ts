import {
  TokenWithBalance,
  TokenWithBalanceSPL,
  TokenWithBalanceSVM,
  TokenType
} from '@avalabs/vm-module-types'
import { SendErrorMessage } from 'errors/sendError'
import { TokenUnit } from '@avalabs/core-utils-sdk/dist'
import { isAddress } from '@solana/kit'
import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { getAccountOccupiedSpace } from '../getAccountOccupiedSpace'
import { isSupportedSVMToken } from './typeguard'
import { getRentExemptMinimum } from './getRentExemptMinimum'

export const validateSupportedToken: (
  token: TokenWithBalance
) => asserts token is TokenWithBalanceSVM = token => {
  if (!isSupportedSVMToken(token)) {
    throw new Error(SendErrorMessage.UNSUPPORTED_TOKEN)
  }
}

export const validateAmount = ({
  amount,
  selectedTokenBalance
}: {
  amount?: TokenUnit
  selectedTokenBalance: bigint
}): void => {
  const amountBigInt = amount?.toSubUnit() ?? 0n

  if (!amountBigInt || amountBigInt <= 0n) {
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)
  }

  if (amountBigInt > selectedTokenBalance) {
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
  }
}

export const validateAddress = ({ address }: { address: string }): void => {
  if (!address) {
    throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
  }

  if (!isAddress(address)) {
    throw new Error(SendErrorMessage.INVALID_ADDRESS)
  }
}

export const validateDestinationAccountRentExempt = async ({
  addressToSend,
  amount,
  provider,
  token,
  setMinAmount
}: {
  addressToSend: string
  amount?: TokenUnit
  provider: SolanaProvider
  token: TokenWithBalanceSVM | TokenWithBalanceSPL
  setMinAmount: (amount: TokenUnit) => void
}): Promise<void> => {
  const amountBigInt = amount?.toSubUnit() ?? 0n

  // isAddress check is required before using with Solana APIs that expect "Address" type, (i.e. getAccountOccupiedSpace)
  if (!isAddress(addressToSend)) {
    throw new Error(SendErrorMessage.INVALID_ADDRESS)
  }

  if (token.type === TokenType.NATIVE) {
    // For native SOL transfers, check recipient account's rent-exempt requirement
    const spaceOccupied = await getAccountOccupiedSpace(addressToSend, provider)
    const rentExemptMinimum = await getRentExemptMinimum(
      spaceOccupied,
      provider
    )

    // If account doesn't exist, ensure first transfer covers rent-exempt minimum
    if (spaceOccupied === 0n) {
      const minAmount = new TokenUnit(
        rentExemptMinimum,
        token.decimals,
        token.symbol
      )
      setMinAmount(minAmount)

      if (amountBigInt < rentExemptMinimum) {
        throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
      }
    }

    if (amountBigInt < rentExemptMinimum) {
      throw new Error(SendErrorMessage.AMOUNT_TOO_LOW)
    }
  } else {
    // look into associated token account
    // For SPL tokens, check if recipient has an associated token account
  }
}
