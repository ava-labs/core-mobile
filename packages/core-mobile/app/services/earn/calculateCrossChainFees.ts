import { UnsignedTx } from '@avalabs/avalanchejs'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { AvaxXP } from 'types/AvaxXP'

/**
 * Calculate the fee needed to perform C-Chain atomic transactions (imports + exports from/to other chains)
 * @param baseFee
 * @param unsignedTx a dummy unsigned transaction object
 *
 * More details: https://docs.avax.network/quickstart/transaction-fees#atomic-transaction-fees
 */
export function calculateCChainFee(
  baseFee: TokenUnit,
  unsignedTx: UnsignedTx
): TokenUnit {
  const usedGas =
    BigInt(unsignedTx.toBytes().length) +
    BigInt(1000 * unsignedTx.getSignedTx().getAllSignatures().length) +
    10000n
  return baseFee.mul(usedGas)
}

/**
 * https://docs.avax.network/quickstart/transaction-fees#fee-schedule
 */
export function calculatePChainFee(): AvaxXP {
  return AvaxXP.fromNanoAvax(1e6)
}
