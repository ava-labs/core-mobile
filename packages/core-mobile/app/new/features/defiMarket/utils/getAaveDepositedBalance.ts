import { type Address, type Client, erc20Abi } from 'viem'
import { multicall, readContract } from 'viem/actions'
import { BIG_ZERO } from '@avalabs/core-utils-sdk'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import Big from 'big.js'
import { AAVE_POOL_DATA_PROVIDER } from '../abis/aavePoolDataProvider'
import type { DefiAssetBalance } from '../types'
import {
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS
} from '../consts'
import { formatAmount } from './formatInterest'

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

export const getAaveDepositedBalance = async ({
  cChainClient,
  walletAddress,
  underlyingTokenDecimals,
  underlyingAssetAddress
}: {
  cChainClient: Client
  walletAddress: Address | undefined
  underlyingTokenDecimals: number
  underlyingAssetAddress: Address
}): Promise<DefiAssetBalance> => {
  if (!walletAddress) {
    return DEFAULT_BALANCE
  }

  const [userReservesRaw, reservesDataRaw] = await multicall(cChainClient, {
    contracts: [
      {
        address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
        abi: AAVE_POOL_DATA_PROVIDER,
        functionName: 'getUserReservesData',
        args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS, walletAddress]
      },
      {
        address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
        abi: AAVE_POOL_DATA_PROVIDER,
        functionName: 'getReservesData',
        args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS]
      }
    ]
  })

  if (!userReservesRaw.result || !reservesDataRaw.result) {
    return DEFAULT_BALANCE
  }

  const userReserves = userReservesRaw.result[0]
  const assetReserve = userReserves.find(
    r =>
      r.underlyingAsset.toLowerCase() === underlyingAssetAddress.toLowerCase()
  )

  if (!assetReserve) {
    return DEFAULT_BALANCE
  }

  const reservesData = reservesDataRaw.result[0]
  const reserveInfo = reservesData.find(
    r =>
      r.underlyingAsset.toLowerCase() === underlyingAssetAddress.toLowerCase()
  )

  if (!reserveInfo) {
    return DEFAULT_BALANCE
  }

  const balanceOf = await readContract(cChainClient, {
    address: reserveInfo.mintTokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [walletAddress]
  })

  const formattedBalance = formatAmount(
    new Big(balanceOf.toString()),
    underlyingTokenDecimals
  )

  const priceInMarketReferenceCurrency = new Big(
    reserveInfo.priceInMarketReferenceCurrency.toString()
  )
  const baseCurrencyInfo = reservesDataRaw.result[1]
  const marketReferenceCurrencyPriceInUsd = new Big(
    baseCurrencyInfo.marketReferenceCurrencyPriceInUsd.toString()
  ).div(10 ** 8)
  const priceInUsd = priceInMarketReferenceCurrency
    .mul(marketReferenceCurrencyPriceInUsd)
    .div(10 ** 8)
  const balanceValue = formattedBalance.mul(priceInUsd)

  return {
    balance: balanceOf,
    balanceValue: {
      value: balanceValue,
      valueString: balanceValue.toString(),
      currencyCode: CurrencyCode.USD
    },
    price: {
      value: priceInUsd,
      valueString: priceInUsd.toString(),
      currencyCode: CurrencyCode.USD
    }
  }
}
