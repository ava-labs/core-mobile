import type { Address, Client } from 'viem'
import { multicall } from 'viem/actions'
import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import { BENQI_Q_TOKEN } from '../abis/benqiQToken'
import type { DefiAssetBalance } from '../types'
import { BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS } from '../consts'
import { BENQI_PRICE_ORACLE } from '../abis/benqiPriceOracle'
import { formatAmount } from './formatInterest'
import { bigIntToBig } from './bigInt'

const DEFAULT_BALANCE = {
  balance: 0n,
  formatted: BIG_ZERO,
  balanceValue: {
    value: BIG_ZERO,
    valueString: '0',
    currencyCode: CurrencyCode.USD
  },
  price: {
    value: BIG_ZERO,
    valueString: '0',
    currencyCode: CurrencyCode.USD
  }
}

export const getBenqiDepositedBalance = async ({
  cChainClient,
  underlyingTokenDecimals,
  walletAddress,
  qTokenAddress
}: {
  cChainClient: Client
  walletAddress: Address | undefined
  underlyingTokenDecimals: number
  qTokenAddress: Address
}): Promise<DefiAssetBalance> => {
  if (!walletAddress) {
    return DEFAULT_BALANCE
  }

  const [balanceOfUnderlyingRaw, underlyingPriceRaw] = await multicall(
    cChainClient,
    {
      contracts: [
        {
          address: qTokenAddress,
          abi: BENQI_Q_TOKEN,
          functionName: 'balanceOfUnderlying',
          args: [walletAddress]
        },
        {
          address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
          abi: BENQI_PRICE_ORACLE,
          functionName: 'getUnderlyingPrice',
          args: [qTokenAddress]
        }
      ]
    }
  )

  if (!balanceOfUnderlyingRaw.result || !underlyingPriceRaw.result) {
    return DEFAULT_BALANCE
  }

  const underlyingPrice = formatAmount(
    bigIntToBig(underlyingPriceRaw.result),
    36 - underlyingTokenDecimals
  )
  const formattedBalance = formatAmount(
    bigIntToBig(balanceOfUnderlyingRaw.result),
    underlyingTokenDecimals
  )
  const balanceValue = formattedBalance.mul(underlyingPrice)

  return {
    balance: balanceOfUnderlyingRaw.result,
    balanceValue: {
      value: balanceValue,
      valueString: formatAmount(
        balanceValue,
        underlyingTokenDecimals
      ).toString(),
      currencyCode: CurrencyCode.USD
    },
    price: {
      value: underlyingPrice,
      valueString: underlyingPrice.toString(),
      currencyCode: CurrencyCode.USD
    }
  }
}
