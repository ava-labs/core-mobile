import React, { useCallback, useState } from 'react'
import { readContract } from 'viem/actions'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import Logger from 'utils/Logger'
import { DefiMarket, MarketNames } from '../../types'
import { useBenqiSetCollateral } from '../../hooks/benqi/useBenqiSetCollateral'
import { useBenqiBorrowData } from '../../hooks/benqi/useBenqiBorrowData'
import { useNetworkClient } from '../../hooks/useNetworkClient'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS, WAD_SCALE } from '../../consts'
import { BENQI_COMPTROLLER_ABI } from '../../abis/benqiComptroller'
import { showHealthImpactAlert } from '../../utils/collateralHealthAlert'
import { SelectCollateralBase } from './SelectCollateralBase'

type TogglingState = Record<string, boolean>

export const BenqiSelectCollateralContent = (): JSX.Element => {
  const network = useCChainNetwork()
  const provider = useAvalancheEvmProvider()
  const networkClient = useNetworkClient(network)

  const { data: borrowData } = useBenqiBorrowData()

  const [togglingState, setTogglingState] = useState<TogglingState>({})

  const handleTransactionSettled = useCallback((requestId?: string) => {
    if (requestId) {
      setTogglingState(prev => ({ ...prev, [requestId]: false }))
    }
  }, [])

  const { setCollateral } = useBenqiSetCollateral({
    network,
    provider,
    onSettled: handleTransactionSettled
  })

  const checkHealthImpact = useCallback(
    async (deposit: DefiMarket): Promise<boolean> => {
      if (!borrowData || !networkClient) return true
      const { liquidity, totalDebtUSD } = borrowData
      if (totalDebtUSD === 0n) return true

      const currentNumerator = liquidity + totalDebtUSD
      const currentHealth = (currentNumerator * WAD_SCALE) / totalDebtUSD
      const currentScore = Number(currentHealth) / Number(WAD_SCALE)

      try {
        const marketsResult = await readContract(networkClient, {
          address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
          abi: BENQI_COMPTROLLER_ABI,
          functionName: 'markets',
          args: [deposit.asset.mintTokenAddress]
        })
        const [, collateralFactorMantissa] = marketsResult as [
          boolean,
          bigint,
          boolean
        ]

        const depositUSD = BigInt(
          deposit.asset.mintTokenBalance.balanceValue.value
            .mul(WAD_SCALE.toString())
            .toFixed(0)
        )
        const collateralReduction =
          (depositUSD * collateralFactorMantissa) / WAD_SCALE
        const newLiquidity =
          liquidity > collateralReduction ? liquidity - collateralReduction : 0n
        const newNumerator = newLiquidity + totalDebtUSD
        const newHealth = (newNumerator * WAD_SCALE) / totalDebtUSD
        const newScore = Number(newHealth) / Number(WAD_SCALE)

        return showHealthImpactAlert(
          deposit.asset.symbol,
          currentScore,
          newScore
        )
      } catch (error) {
        Logger.error(
          'Failed to fetch collateral factor for health check',
          error
        )
        return true
      }
    },
    [borrowData, networkClient]
  )

  const handleToggleCollateral = useCallback(
    async (deposit: DefiMarket, newValue: boolean) => {
      const requestId = deposit.uniqueMarketId

      if (!newValue) {
        setTogglingState(prev => ({ ...prev, [requestId]: true }))
        const shouldProceed = await checkHealthImpact(deposit)
        if (!shouldProceed) {
          setTogglingState(prev => ({ ...prev, [requestId]: false }))
          return
        }
      } else {
        setTogglingState(prev => ({ ...prev, [requestId]: true }))
      }

      try {
        await setCollateral({
          qTokenAddress: deposit.asset.mintTokenAddress,
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
      protocol={MarketNames.benqi}
      onToggleCollateral={handleToggleCollateral}
      togglingState={togglingState}
    />
  )
}
