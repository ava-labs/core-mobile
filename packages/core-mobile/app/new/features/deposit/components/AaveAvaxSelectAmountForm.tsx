import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { DefiMarket, DepositAsset } from '../types'
import { DEPOSIT_ETH_GAS_AMOUNT } from '../consts'
import { useMaxDepositAmount } from '../hooks/useMaxDepositAmount'
import { useAaveDepositAvax } from '../hooks/aave/useAaveDepositAvax'
import { SelectAmountFormBase } from './SelectAmountFormBase'

export const AaveAvaxSelectAmountForm = ({
  asset,
  market,
  onSuccess
}: {
  asset: DepositAsset
  market: DefiMarket
  onSuccess: () => void
}): JSX.Element => {
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      asset.token.balance,
      asset.token.decimals,
      asset.token.symbol
    )
  }, [asset.token])

  const { aaveDepositAvax } = useAaveDepositAvax({ market })
  const { maxAmount } = useMaxDepositAmount({
    token: asset.token,
    gasAmount: DEPOSIT_ETH_GAS_AMOUNT
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

  return (
    <SelectAmountFormBase
      asset={asset}
      tokenBalance={tokenBalance}
      maxAmount={maxAmount}
      validateAmount={validateAmount}
      submit={aaveDepositAvax}
      onSuccess={onSuccess}
    />
  )
}
