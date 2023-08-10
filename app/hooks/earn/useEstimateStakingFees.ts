import { Avax } from 'types/Avax'
import { useGetAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import { useEffect, useMemo, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'

const importFee = calculatePChainFee()

/**
 * useEstimateStakingFee estimates fee by making dummy Export C transaction and
 * then using calculateCChainFee. However, this will happen only if there is
 * some amount to be transferred from C to P chain, which is determined by
 * using useGetAmountForCrossChainTransfer.
 */
export const useEstimateStakingFees = (
  stakingAmount: Avax
): Avax | undefined => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)
  const activeAccount = useSelector(selectActiveAccount)
  const amountForCrossChainTransfer =
    useGetAmountForCrossChainTransfer(stakingAmount)
  const [estimatedStakingFee, setEstimatedStakingFee] = useState<
    Avax | undefined
  >(undefined)
  const cChainBaseFeeWei = useCChainBaseFee()
  const baseFee = useMemo(
    () =>
      cChainBaseFeeWei.data !== undefined
        ? Avax.fromWei(cChainBaseFeeWei.data)
        : undefined,
    [cChainBaseFeeWei.data]
  )

  useEffect(() => {
    const calculateEstimatedStakingFee = async () => {
      if (amountForCrossChainTransfer === undefined) {
        setEstimatedStakingFee(undefined)
        return
      }
      if (amountForCrossChainTransfer.isZero()) {
        setEstimatedStakingFee(Avax.fromBase(0))
        return
      }
      if (
        baseFee === undefined ||
        activeAccount === undefined ||
        activeAccount.addressPVM === undefined
      ) {
        setEstimatedStakingFee(undefined)
        return
      }

      const totalAmount = amountForCrossChainTransfer.add(importFee) // we need to include import fee
      const instantBaseFee = WalletService.getInstantBaseFee(baseFee)

      const unsignedTx = await WalletService.createExportCTx({
        amount: totalAmount,
        baseFee: instantBaseFee,
        accountIndex: activeAccount.index,
        avaxXPNetwork,
        destinationChain: 'P',
        destinationAddress: activeAccount.addressPVM,
        // we only need to validate burned amount
        // when the actual submission happens
        shouldValidateBurnedAmount: false
      })

      const exportFee = calculateCChainFee(instantBaseFee, unsignedTx)
      setEstimatedStakingFee(exportFee.add(importFee))
    }
    calculateEstimatedStakingFee().catch(reason => Logger.error(reason))
  }, [activeAccount, amountForCrossChainTransfer, avaxXPNetwork, baseFee])

  return estimatedStakingFee
}
