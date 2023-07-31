import { Avax } from 'types/Avax'
import { useGetAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import { useEffect, useMemo, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import { AvalancheTransactionRequest } from 'services/wallet/types'
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

      const totalAmount = amountForCrossChainTransfer.add(importFee) //we need to include import fee
      const instantFee = baseFee.add(baseFee.mul(0.2)) // Increase by 20% for instant speed

      const unsignedTx = await WalletService.createExportCTx(
        totalAmount,
        instantFee,
        activeAccount.index,
        avaxXPNetwork,
        'P',
        activeAccount.addressPVM
      )
      const signedTxJson = await WalletService.sign(
        { tx: unsignedTx } as AvalancheTransactionRequest,
        activeAccount.index,
        avaxXPNetwork
      )
      const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()
      const exportFee = calculateCChainFee(instantFee, unsignedTx, signedTx)
      setEstimatedStakingFee(exportFee.add(importFee))
    }
    calculateEstimatedStakingFee().catch(reason => Logger.error(reason))
  }, [activeAccount, amountForCrossChainTransfer, avaxXPNetwork, baseFee])

  return estimatedStakingFee
}
