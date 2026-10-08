import { Avalanche } from '@avalabs/core-wallets-sdk'
import { networkIDs, utils } from '@avalabs/avalanchejs'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { SendErrorMessage } from '../types'

// Reject addresses whose network (avax/fuji) does not match the active network.
const getAddressHrp = (address: string): string => {
  const bech32Part = address.includes('-')
    ? address.slice(address.indexOf('-') + 1)
    : address
  const [hrp] = utils.parseBech32(bech32Part)
  return hrp
}

const assertValidAddressForNetwork = (
  address: string,
  isTestnet: boolean
): void => {
  const expectedHrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP
  let addressHrp: string | undefined
  try {
    addressHrp = getAddressHrp(address)
  } catch {
    throw new Error(SendErrorMessage.INVALID_ADDRESS)
  }

  const isStructurallyValid =
    Avalanche.isBech32Address(address, false) ||
    Avalanche.isBech32Address(address, true)

  if (addressHrp !== expectedHrp || !isStructurallyValid)
    throw new Error(SendErrorMessage.INVALID_ADDRESS)
}

export const validate = ({
  amount,
  address,
  maxFee,
  token,
  spendableBalance,
  isTestnet
}: {
  amount: bigint | undefined
  address: string | undefined
  maxFee: bigint
  token: TokenWithBalanceAVM
  /**
   * CP-13903: dust-filtered spendable balance. When set it replaces the
   * displayed balance, which can include dust the send tx builder will
   * refuse to spend.
   */
  spendableBalance?: bigint
  isTestnet: boolean
}): void => {
  if (!address) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)

  const fee = maxFee ? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee : 0n

  const balance = spendableBalance ?? token.available ?? 0n
  const maxAmountValue = balance - fee

  assertValidAddressForNetwork(address, isTestnet)

  if (!maxFee || maxFee === 0n)
    throw new Error(SendErrorMessage.INVALID_NETWORK_FEE)

  if (balance <= fee)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)

  if (!amount || amount === 0n)
    throw new Error(SendErrorMessage.AMOUNT_REQUIRED)

  if (amount && amount > maxAmountValue)
    throw new Error(SendErrorMessage.INSUFFICIENT_BALANCE)
}
