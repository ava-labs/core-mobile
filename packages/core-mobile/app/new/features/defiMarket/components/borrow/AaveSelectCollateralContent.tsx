import React, { useCallback, useState } from 'react'
import { Address, formatUnits } from 'viem'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import Logger from 'utils/Logger'
import { WAVAX_ADDRESS } from 'features/swap/consts'
import { DefiMarket, MarketNames } from '../../types'
import { useAaveSetCollateral } from '../../hooks/aave/useAaveSetCollateral'
import { useAaveBorrowData } from '../../hooks/aave/useAaveBorrowData'
import { AAVE_PRICE_ORACLE_SCALE, WAD, WAD_SCALE } from '../../consts'
import { showHealthImpactAlert } from '../../utils/collateralHealthAlert'
import { SelectCollateralBase } from './SelectCollateralBase'

type TogglingState = Record<string, boolean>

export const AaveSelectCollateralContent = (): JSX.Element => {
  const network = useCChainNetwork()
  const provider = useAvalancheEvmProvider()

  const { data: borrowData } = useAaveBorrowData()

  const [togglingState, setTogglingState] = useState<TogglingState>({})

  const handleTransactionSettled = useCallback((requestId?: string) => {
    if (requestId) {
      setTogglingState(prev => ({ ...prev, [requestId]: false }))
    }
  }, [])

  const { setCollateral } = useAaveSetCollateral({
    network,
    provider,
    onSettled: handleTransactionSettled
  })

  const checkHealthImpact = useCallback(
    async (deposit: DefiMarket): Promise<boolean> => {
      if (!borrowData) return true
      const {
        totalCollateralUSD,
        totalDebtUSD,
        liquidationThreshold,
        healthFactor
      } = borrowData
      if (totalDebtUSD === 0n) return true

      const currentScore = Number(formatUnits(healthFactor, WAD))
      const depositUSD = BigInt(
        deposit.asset.mintTokenBalance.balanceValue.value
          .mul(10 ** AAVE_PRICE_ORACLE_SCALE)
          .toFixed(0)
      )
      const newCollateralUSD =
        totalCollateralUSD > depositUSD ? totalCollateralUSD - depositUSD : 0n
      const newHealthFactor =
        (newCollateralUSD * liquidationThreshold * WAD_SCALE) /
        (totalDebtUSD * 10000n)
      const newScore = Number(formatUnits(newHealthFactor, WAD))

      return showHealthImpactAlert(deposit.asset.symbol, currentScore, newScore)
    },
    [borrowData]
  )

  const handleToggleCollateral = useCallback(
    async (deposit: DefiMarket, newValue: boolean) => {
      if (!newValue) {
        const shouldProceed = await checkHealthImpact(deposit)
        if (!shouldProceed) return
      }

      const requestId = deposit.uniqueMarketId
      setTogglingState(prev => ({ ...prev, [requestId]: true }))

      try {
        const assetAddress = deposit.asset.contractAddress ?? WAVAX_ADDRESS
        await setCollateral({
          assetAddress: assetAddress as Address,
          useAsCollateral: newValue,
          requestId
        })
      } catch (error) {
        Logger.error('Failed to set collateral', error)
        setTogglingState(prev => ({ ...prev, [requestId]: false }))
      }
    },
    [setCollateral, checkHealthImpact]
  )

  return (
    <SelectCollateralBase
      protocol={MarketNames.aave}
      onToggleCollateral={handleToggleCollateral}
      togglingState={togglingState}
    />
  )
}
