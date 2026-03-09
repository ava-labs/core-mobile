import React, { useCallback, useMemo } from 'react'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Address } from 'viem'
import { hasEnoughAllowance } from 'features/swap/utils/evm/ensureAllowance'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import { TokenType } from '@avalabs/vm-module-types'
import { useCChainGasCost } from 'common/hooks/useCChainGasCost'
import { DefiMarket, DepositAsset } from '../../types'
import { APPROVE_GAS_AMOUNT, MINT_GAS_AMOUNT, WAD } from '../../consts'
import { useBenqiDepositErc20 } from '../../hooks/benqi/useBenqiDepositErc20'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
import { SelectAmountFormBase } from '../SelectAmountFormBase'

export const BenqiErc20SelectAmountForm = ({
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
  const { benqiDepositErc20 } = useBenqiDepositErc20({
    asset,
    market,
    onConfirmed,
    onReverted,
    onError
  })

  const qTokenAddress = market.asset.mintTokenAddress as Address
  const { data: borrowData } = useBenqiBorrowData(qTokenAddress)

  const currentHealthScore = useMemo(() => {
    if (!borrowData) return undefined
    const { liquidity, totalDebtUSD } = borrowData
    if (totalDebtUSD === 0n) return Infinity
    const numerator = liquidity + totalDebtUSD
    const health = (numerator * 10n ** BigInt(WAD)) / totalDebtUSD
    return Number(health) / Number(10n ** BigInt(WAD))
  }, [borrowData])

  const hasDebt = borrowData !== undefined && borrowData.totalDebtUSD > 0n

  const calculateHealthScore = useCallback(
    (depositAmount: TokenUnit): number | undefined => {
      if (!borrowData) return undefined
      const { liquidity, totalDebtUSD, tokenPriceUSD, collateralFactor } =
        borrowData
      if (totalDebtUSD === 0n) return Infinity
      const depositUSD =
        (depositAmount.toSubUnit() * tokenPriceUSD) / 10n ** BigInt(WAD)
      const depositCollateralEffect =
        (depositUSD * collateralFactor) / 10n ** BigInt(WAD)
      const newLiquidity = liquidity + depositCollateralEffect
      const numerator = newLiquidity + totalDebtUSD
      const newHealth = (numerator * 10n ** BigInt(WAD)) / totalDebtUSD
      return Number(newHealth) / Number(10n ** BigInt(WAD))
    },
    [borrowData]
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
        spenderAddress: market.asset.mintTokenAddress,
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
      address,
      market.asset.mintTokenAddress
    ]
  )

  return (
    <SelectAmountFormBase
      token={asset.token}
      tokenBalance={tokenBalance}
      maxAmount={tokenBalance}
      validateAmount={validateAmount}
      submit={benqiDepositErc20}
      onSubmitted={onSubmitted}
      currentHealthScore={hasDebt ? currentHealthScore : undefined}
      calculateHealthScore={hasDebt ? calculateHealthScore : undefined}
    />
  )
}
