import { UnsignedTx } from '@avalabs/avalanchejs'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'

/**
 * Calculate the fee needed to perform C-Chain atomic transactions (imports + exports from/to other chains)
 * @param baseFee
 * @param unsignedTx a dummy unsigned transaction object
 *
 * More details: https://build.avax.network/docs/api-reference/guides/txn-fees#atomic-transaction-fees
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
export async function calculatePChainFee(network: Network): Promise<TokenUnit> {
  const networkFees = await ModuleManager.avalancheModule.getNetworkFee(network)
  return new TokenUnit(
    networkFees.low.maxFeePerGas,
    network.networkToken.decimals,
    network.networkToken.symbol
  )
}
