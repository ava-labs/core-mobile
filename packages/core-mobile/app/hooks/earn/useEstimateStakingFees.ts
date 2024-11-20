import { useGetAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import { useEffect, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'
import NetworkService from 'services/network/NetworkService'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import { weiToNano } from 'utils/units/converter'

const importFee = calculatePChainFee()

/**
 * useEstimateStakingFee estimates fee by making dummy Export C transaction and
 * then using calculateCChainFee. However, this will happen only if there is
 * some amount to be transferred from C to P chain, which is determined by
 * using useGetAmountForCrossChainTransfer.
 */
export const useEstimateStakingFees = (
  stakingAmount: TokenUnit
): TokenUnit | undefined => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
  const activeAccount = useSelector(selectActiveAccount)
  const amountForCrossChainTransfer =
    useGetAmountForCrossChainTransfer(stakingAmount)
  const [estimatedStakingFee, setEstimatedStakingFee] = useState<
    TokenUnit | undefined
  >(undefined)
  const baseFee = useCChainBaseFee().data

  useEffect(() => {
    const calculateEstimatedStakingFee = async (): Promise<void> => {
      if (amountForCrossChainTransfer === undefined) {
        setEstimatedStakingFee(undefined)
        return
      }
      if (amountForCrossChainTransfer.isZero()) {
        setEstimatedStakingFee(zeroAvaxPChain())
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
        amountInNAvax: weiToNano(totalAmount.toSubUnit()),
        baseFeeInNAvax: weiToNano(instantBaseFee.toSubUnit()),
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
    calculateEstimatedStakingFee().catch(Logger.error)
  }, [activeAccount, amountForCrossChainTransfer, avaxXPNetwork, baseFee])

  return estimatedStakingFee
}
