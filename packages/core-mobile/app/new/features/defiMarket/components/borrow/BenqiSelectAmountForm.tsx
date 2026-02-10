import React, { useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address } from 'viem'
import { DefiMarket, MarketNames } from '../../types'
import {
  useUserBorrowData,
  convertUsdToTokenAmount
} from '../../hooks/useUserBorrowData'
import { WAD } from '../../consts'
import { BorrowSelectAmountFormBase } from './BorrowSelectAmountFormBase'

export const BorrowBenqiSelectAmountForm = ({
  market,
  onSubmitted,
  onConfirmed,
  onReverted,
  onError
}: {
  market: DefiMarket
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): JSX.Element => {
  // For Benqi, pass the qToken address to get price from Benqi Price Oracle
  const qTokenAddress = market.asset.mintTokenAddress as Address
  const { data: borrowData } = useUserBorrowData(
    MarketNames.benqi,
    qTokenAddress
  )

  // Calculate available to borrow in token units using oracle price
  const availableToBorrow = useMemo(() => {
    if (!borrowData?.availableBorrowsUSD || !borrowData?.tokenPriceUSD) {
      return new TokenUnit(
        BigInt(0),
        market.asset.decimals,
        market.asset.symbol
      )
    }

    // Benqi: USD amount is 18 decimals
    // Benqi Price Oracle returns: price * 10^(36 - underlyingDecimals)
    const priceDecimals = 36 - market.asset.decimals
    const tokenAmount = convertUsdToTokenAmount({
      usdAmount: borrowData.availableBorrowsUSD,
      tokenPriceUSD: borrowData.tokenPriceUSD,
      tokenDecimals: market.asset.decimals,
      usdDecimals: WAD,
      priceDecimals
    })

    return new TokenUnit(
      tokenAmount,
      market.asset.decimals,
      market.asset.symbol
    )
  }, [borrowData, market.asset.decimals, market.asset.symbol])

  // Benqi doesn't provide health factor directly via getAccountLiquidity
  // Would need additional calls to calculate: (totalCollateral * liquidationThreshold) / totalDebt

  // TODO: Implement borrow hook
  const handleSubmit = async ({
    amount
  }: {
    amount: TokenUnit
  }): Promise<string> => {
    // eslint-disable-next-line no-console
    console.log(
      'Benqi borrow:',
      amount.toDisplay(),
      onConfirmed,
      onReverted,
      onError
    )
    throw new Error('Borrow not implemented yet')
  }

  return (
    <BorrowSelectAmountFormBase
      token={market.asset}
      availableToBorrow={availableToBorrow}
      currentHealthScore={undefined}
      calculateHealthScore={undefined}
      submit={handleSubmit}
      onSubmitted={onSubmitted}
    />
  )
}
