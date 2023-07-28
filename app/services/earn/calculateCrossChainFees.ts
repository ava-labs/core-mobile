import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs-v2'
import { Avax } from 'types/Avax'

/**
 * https://docs.avax.network/quickstart/transaction-fees#atomic-transaction-fees
 * @param baseFee in WEI
 * @param unsignedTx
 * @param signedTx
 * @return Fee in nAvax
 */
export function calculateCChainFee(
  baseFee: Avax,
  unsignedTx: UnsignedTx,
  signedTx: avaxSerial.SignedTx
): Avax {
  const usedGas =
    BigInt(unsignedTx.toBytes().length) +
    BigInt(1000 * signedTx.getAllSignatures().length) +
    10000n

  return baseFee.mul(usedGas)
}

/**
 * https://docs.avax.network/quickstart/transaction-fees#fee-schedule
 */
export function calculatePChainFee(): Avax {
  return Avax.fromBase(0.001)
}
