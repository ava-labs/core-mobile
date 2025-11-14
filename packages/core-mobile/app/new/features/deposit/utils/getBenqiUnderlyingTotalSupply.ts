import type { Address, Client } from 'viem'
import { multicall } from 'viem/actions'
import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import { BENQI_Q_TOKEN } from '../abis/benqiQToken'
import { BENQI_QI_TOKEN_DECIMALS } from '../consts'
import { bigIntToBig } from './bigInt'
import { formatAmount } from './formatInterest'

export const getBenqiUnderlyingTotalSupply = async ({
  qTokenAddress,
  underlyingTokenDecimals,
  cChainClient
}: {
  qTokenAddress: Address
  underlyingTokenDecimals: number
  cChainClient: Client
}): Promise<Big> => {
  // Fetch total supply (qToken, 8 decimals) & exchange rate (scaled by 1e(10+underlyingDecimals))
  // See: https://gist.github.com/mikkompeltonen/874e36301213952bb9bebe668d296e9c
  const [totalSupplyRaw, exchangeRateStoredRaw] = await multicall(
    cChainClient,
    {
      contracts: [
        {
          address: qTokenAddress,
          abi: BENQI_Q_TOKEN,
          functionName: 'totalSupply'
        },
        {
          address: qTokenAddress,
          abi: BENQI_Q_TOKEN,
          functionName: 'exchangeRateStored'
        }
      ]
    }
  )

  const totalSupply = totalSupplyRaw.result
    ? formatAmount(bigIntToBig(totalSupplyRaw.result), BENQI_QI_TOKEN_DECIMALS)
    : BIG_ZERO
  const exchangeRate = exchangeRateStoredRaw.result
    ? formatAmount(
        bigIntToBig(exchangeRateStoredRaw.result),
        10 + underlyingTokenDecimals
      )
    : BIG_ZERO

  return totalSupply.mul(exchangeRate)
}
