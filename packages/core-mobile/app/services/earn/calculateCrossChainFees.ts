import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { Avax } from 'types/Avax'

/**
 * Calculate the fee needed to perform C-Chain atomic transactions (imports + exports from/to other chains)
 * @param baseFee
 * @param unsignedTx a dummy unsigned transaction object
 *
 * More details: https://docs.avax.network/quickstart/transaction-fees#atomic-transaction-fees
 */
export function calculateCChainFee(
  baseFee: Avax,
  unsignedTx: UnsignedTx
): Avax {
  const usedGas =
    BigInt(unsignedTx.toBytes().length) +
    BigInt(1000 * unsignedTx.getSignedTx().getAllSignatures().length) +
    10000n
  return baseFee.mul(usedGas)
}

/**
 * https://docs.avax.network/quickstart/transaction-fees#fee-schedule
 */
export function calculatePChainFee(): Avax {
  return Avax.fromBase(0.001)
}
