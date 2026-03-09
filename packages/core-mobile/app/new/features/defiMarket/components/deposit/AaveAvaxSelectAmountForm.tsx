import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Address, formatUnits } from 'viem'
import { WAVAX_ADDRESS } from 'features/swap/consts'
import { DefiMarket, DepositAsset } from '../../types'
import { DEPOSIT_ETH_GAS_AMOUNT, WAD } from '../../consts'
import { useMaxDepositAmount } from '../../hooks/useMaxDepositAmount'
import { useAaveDepositAvax } from '../../hooks/aave/useAaveDepositAvax'
import { useAaveBorrowData } from '../../hooks/aave/useAaveBorrowData'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const AaveAvaxSelectAmountForm = ({
  asset,
  market,
  onSubmitted,
  onConfirmed,
  onReverted,
  onError
}: {
  asset: DepositAsset
  market: DefiMarket
  onSubmitted: (params: { txHash: string; amount: TokenUnit }) => void
  onConfirmed?: () => void
  onReverted?: () => void
  onError?: () => void
}): JSX.Element => {
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      asset.token.balance,
      asset.token.decimals,
      asset.token.symbol
    )
  }, [asset.token])

  const { aaveDepositAvax } = useAaveDepositAvax({
    market,
    onConfirmed,
    onReverted,
    onError
  })
  const { maxAmount } = useMaxDepositAmount({
    token: asset.token,
    gasAmount: DEPOSIT_ETH_GAS_AMOUNT
  })

  const { data: borrowData } = useAaveBorrowData(WAVAX_ADDRESS as Address)

  const currentHealthScore = useMemo(() => {
    if (!borrowData) return undefined
    if (borrowData.totalDebtUSD === 0n) return Infinity
    return Number(formatUnits(borrowData.healthFactor, WAD))
  }, [borrowData])

  const hasDebt = borrowData !== undefined && borrowData.totalDebtUSD > 0n

  const calculateHealthScore = useCallback(
    (depositAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const {
        totalCollateralUSD,
        totalDebtUSD,
        liquidationThreshold,
        tokenPriceUSD
      } = borrowData
      if (totalDebtUSD === 0n) return Infinity
      const depositUSD =
        (depositAmount.toSubUnit() * tokenPriceUSD) /
        10n ** BigInt(asset.token.decimals)
      const newCollateralUSD = totalCollateralUSD + depositUSD
      const newHealthFactor =
        (newCollateralUSD * liquidationThreshold * 10n ** BigInt(WAD)) /
        (totalDebtUSD * 10000n)
      return Number(formatUnits(newHealthFactor, WAD))
    },
    [borrowData, asset.token.decimals]
  )

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }

      if (maxAmount && amt.gt(maxAmount)) {
        throw new Error(
          'The specified amount exceeds the available balance for gas fees'
        )
      }
    },
    [tokenBalance, maxAmount]
  )

  return (
    <SelectAmountFormBase
      token={asset.token}
      tokenBalance={tokenBalance}
      maxAmount={maxAmount}
      validateAmount={validateAmount}
      submit={aaveDepositAvax}
      onSubmitted={onSubmitted}
      currentHealthScore={hasDebt ? currentHealthScore : undefined}
      calculateHealthScore={hasDebt ? calculateHealthScore : undefined}
    />
  )
}
