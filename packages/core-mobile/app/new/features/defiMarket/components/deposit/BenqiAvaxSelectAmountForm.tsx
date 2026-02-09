import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { DefiMarket, DepositAsset } from '../../types'
import { MINT_GAS_AMOUNT } from '../../consts'
import { useMaxDepositAmount } from '../../hooks/useMaxDepositAmount'
import { useBenqiDepositAvax } from '../../hooks/benqi/useBenqiDepositAvax'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const BenqiAvaxSelectAmountForm = ({
  asset,
  market,
  onSuccess
}: {
  asset: DepositAsset
  market: DefiMarket
  onSuccess: () => void
}): JSX.Element => {
  const activeAccount = useSelector(selectActiveAccount)
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      asset.token.balance,
      asset.token.decimals,
      asset.token.symbol
    )
  }, [asset.token])

  const { benqiDepositAvax } = useBenqiDepositAvax({ market })
  const { maxAmount } = useMaxDepositAmount({
    token: asset.token,
    gasAmount: MINT_GAS_AMOUNT
  })

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

  const handleSuccess = useCallback(
    ({ txHash, amount }: { txHash: string; amount: TokenUnit }) => {
      AnalyticsService.capture('EarnDepositSubmitted', {
        token: asset.token.symbol,
        quantity: amount.toDisplay(),
        protocol: market.marketName,
        txHash,
        address: activeAccount?.addressC ?? ''
      })
      onSuccess()
    },
    [asset.token.symbol, market.marketName, activeAccount?.addressC, onSuccess]
  )

  return (
    <SelectAmountFormBase
      token={asset.token}
      tokenBalance={tokenBalance}
      maxAmount={maxAmount}
      validateAmount={validateAmount}
      submit={benqiDepositAvax}
      onSuccess={handleSuccess}
      onFailure={() => AnalyticsService.capture('EarnDepositFailure')}
    />
  )
}
