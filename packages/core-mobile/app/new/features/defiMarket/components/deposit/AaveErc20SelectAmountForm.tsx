import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Address, formatUnits } from 'viem'
import { hasEnoughAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { TokenType } from '@avalabs/vm-module-types'
import { useCChainGasCost } from 'common/hooks/useCChainGasCost'
import { DefiMarket, DepositAsset } from '../../types'
import { useAaveDepositErc20 } from '../../hooks/aave/useAaveDepositErc20'
import { useAaveBorrowData } from '../../hooks/aave/useAaveBorrowData'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  APPROVE_GAS_AMOUNT,
  MINT_GAS_AMOUNT,
  WAD
} from '../../consts'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const AaveErc20SelectAmountForm = ({
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
  const provider = useAvalancheEvmProvider()
  const tokenBalance = useMemo(() => {
    return new TokenUnit(
      asset.token.balance,
      asset.token.decimals,
      asset.token.symbol
    )
  }, [asset.token])
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const { gasCost: mintGasCost } = useCChainGasCost({
    gasAmount: MINT_GAS_AMOUNT
  })
  const { gasCost: approveGasCost } = useCChainGasCost({
    gasAmount: APPROVE_GAS_AMOUNT
  })
  const { aaveDepositErc20 } = useAaveDepositErc20({
    asset,
    market,
    onConfirmed,
    onReverted,
    onError
  })

  const underlyingAssetAddress = asset.token.address as Address
  const { data: borrowData } = useAaveBorrowData(underlyingAssetAddress)

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
        10n ** BigInt(market.asset.decimals)
      const newCollateralUSD = totalCollateralUSD + depositUSD
      const newHealthFactor =
        (newCollateralUSD * liquidationThreshold * 10n ** BigInt(WAD)) /
        (totalDebtUSD * 10000n)
      return Number(formatUnits(newHealthFactor, WAD))
    },
    [borrowData, market.asset.decimals]
  )

  const validateAmount = useCallback(
    async (amt: TokenUnit) => {
      if (!asset.nativeToken) {
        throw new Error('Native token balance is not available')
      }

      if (asset.token.type !== TokenType.ERC20) {
        throw new Error('Token type is not ERC20')
      }

      if (!provider) {
        throw new Error('Provider is not available')
      }

      if (!mintGasCost || !approveGasCost) {
        throw new Error('Gas costs are not available')
      }

      if (tokenBalance && amt.gt(tokenBalance)) {
        throw new Error('The specified amount exceeds the available balance')
      }

      const hasEnoughAllowanceResult = await hasEnoughAllowance({
        tokenAddress: asset.token.address as Address,
        provider: provider,
        userAddress: address as Address,
        spenderAddress: AAVE_POOL_C_CHAIN_ADDRESS,
        requiredAmount: amt.toSubUnit()
      })

      const gasFees = hasEnoughAllowanceResult
        ? mintGasCost
        : mintGasCost + approveGasCost

      if (gasFees > asset.nativeToken.balance) {
        throw new Error(
          `Insufficient ${asset.nativeToken.symbol} balance for gas fees`
        )
      }
    },
    [
      tokenBalance,
      mintGasCost,
      approveGasCost,
      asset.nativeToken,
      asset.token,
      provider,
      address
    ]
  )

  return (
    <SelectAmountFormBase
      token={asset.token}
      tokenBalance={tokenBalance}
      maxAmount={tokenBalance}
      validateAmount={validateAmount}
      submit={aaveDepositErc20}
      onSubmitted={onSubmitted}
      currentHealthScore={hasDebt ? currentHealthScore : undefined}
      calculateHealthScore={hasDebt ? calculateHealthScore : undefined}
    />
  )
}
