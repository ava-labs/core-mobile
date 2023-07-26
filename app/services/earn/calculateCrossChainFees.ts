import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs-v2'
import BN from 'bn.js'
import { Avax } from 'types/Avax'

/**
 * https://docs.avax.network/quickstart/transaction-fees#atomic-transaction-fees
 * @param baseFee in WEI
 * @param unsignedTx
 * @param signedTx
 * @return Fee in nAvax
 */
export function calculateCChainFee(
  baseFee: bigint,
  unsignedTx: UnsignedTx,
  signedTx: avaxSerial.SignedTx
): BN {
  const baseFeeNAvax = new BN(baseFee.toString()).div(new BN(1e9))
  const usedGas = new BN(
    1 * unsignedTx.toBytes().length +
      1000 * signedTx.getAllSignatures().length +
      10000
  )
  return usedGas.mul(baseFeeNAvax)
}

/**
 * https://docs.avax.network/quickstart/transaction-fees#fee-schedule
 */
export function calculatePChainFee(): Avax {
  return Avax.fromBase(0.001)
}
