import { Avalanche } from '@avalabs/core-wallets-sdk'
import { networkIDs, utils } from '@avalabs/avalanchejs'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { GAS_LIMIT_FOR_X_CHAIN } from 'consts/fees'
import { SendErrorMessage } from '../types'

// SECURITY (M7): extract the bech32 HRP from an address that may carry a
// chain-alias prefix (e.g. "P-avax1…"), so we can reject addresses whose
// network (avax/fuji) does not match the active network.
const getAddressHrp = (address: string): string => {
  const bech32Part = address.includes('-')
    ? address.slice(address.indexOf('-') + 1)
    : address
  const [hrp] = utils.parseBech32(bech32Part)
  return hrp
}

// SECURITY (M7): require both a structurally valid bech32 address and an HRP
// matching the active network. Previously any avax OR fuji address was
// accepted regardless of the active network, so a cross-network address could
// be sent to.
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
  estimatedFee,
  gasPrice,
  spendableBalance,
  isTestnet
}: {
  amount: bigint
  address: string | undefined
  maxFee: bigint
  token: TokenWithBalancePVM
  estimatedFee?: bigint
  gasPrice?: bigint
  /**
   * CP-13903: dust-filtered spendable balance. When set it replaces the
   * displayed balance, which can include dust the send tx builder will
   * refuse to spend.
   */
  spendableBalance?: bigint
  /**
   * SECURITY (M7): active network's testnet flag. The address HRP must match
   * (mainnet→avax, testnet→fuji) so a cross-network address can't be sent to.
   */
  isTestnet: boolean
}): void => {
  if (!address) throw new Error(SendErrorMessage.ADDRESS_REQUIRED)
  // TODO: use correct gas limit for P-chain
  const fee = estimatedFee ?? BigInt(GAS_LIMIT_FOR_X_CHAIN) * maxFee

  const balance = spendableBalance ?? token.available ?? 0n
  const maxAmountValue = balance - fee

  assertValidAddressForNetwork(address, isTestnet)

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
