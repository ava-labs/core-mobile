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
import { selectActiveNetwork } from 'store/network'
import { isDevnet } from 'utils/isDevnet'
import { weiToNano } from 'utils/units/converter'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { CorePrimaryAccount } from '@avalabs/types'
import { pvm } from '@avalabs/avalanchejs'

/**
 * useEstimateStakingFee estimates fee by making dummy Export C transaction and
 * then using calculateCChainFee. However, this will happen only if there is
 * some amount to be transferred from C to P chain, which is determined by
 * using useGetAmountForCrossChainTransfer.
 */
export const useEstimateStakingFees = ({
  stakingAmount,
  gasPrice,
  xpProvider,
  getFeeState
}: {
  stakingAmount: TokenUnit
  gasPrice?: bigint
  xpProvider?: Avalanche.JsonRpcProvider
  getFeeState: (gasPrice?: bigint) => pvm.FeeState | undefined
}): {
  estimatedStakingFee?: TokenUnit
  defaultTxFee?: TokenUnit
} => {
  const activeNetwork = useSelector(selectActiveNetwork)
  const isDevMode = useSelector(selectIsDeveloperMode)
  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(
    isDevMode,
    isDevnet(activeNetwork)
  )
  const activeAccount = useSelector(selectActiveAccount)
  const amountForCrossChainTransfer =
    useGetAmountForCrossChainTransfer(stakingAmount)
  const [estimatedStakingFee, setEstimatedStakingFee] = useState<
    TokenUnit | undefined
  >(undefined)
  const [defaultTxFee, setDefaultTxFee] = useState<TokenUnit>()

  const baseFee = useCChainBaseFee().data

  useEffect(() => {
    const getDefaultTxFee = async (): Promise<void> => {
      if (
        amountForCrossChainTransfer === undefined ||
        activeAccount === undefined ||
        xpProvider === undefined ||
        getFeeState() === undefined
      ) {
        return
      }
      const txFee = await getImportFee({
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState: getFeeState()
      })
      setDefaultTxFee(txFee)
    }
    getDefaultTxFee().catch(Logger.error)
  }, [
    activeAccount,
    avaxXPNetwork,
    amountForCrossChainTransfer,
    getFeeState,
    xpProvider
  ])

  useEffect(() => {
    const calculateEstimatedStakingFee = async (): Promise<void> => {
      if (xpProvider === undefined || defaultTxFee === undefined) return

      if (amountForCrossChainTransfer === undefined) {
        setEstimatedStakingFee(undefined)
        return
      }

      if (amountForCrossChainTransfer.isZero() && !xpProvider.isEtnaEnabled()) {
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

      const importFee = await getImportFee({
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState: getFeeState(gasPrice)
      })
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
  }, [
    activeAccount,
    amountForCrossChainTransfer,
    avaxXPNetwork,
    baseFee,
    defaultTxFee,
    gasPrice,
    getFeeState,
    isDevMode,
    stakingAmount,
    xpProvider
  ])

  return {
    estimatedStakingFee,
    defaultTxFee
  }
}

const getImportFee = async ({
  activeAccount,
  avaxXPNetwork,
  provider,
  feeState
}: {
  activeAccount: CorePrimaryAccount
  avaxXPNetwork: Network
  provider: Avalanche.JsonRpcProvider
  feeState?: pvm.FeeState
}): Promise<TokenUnit> => {
  if (provider.isEtnaEnabled()) {
    const unsignedTxP = await WalletService.createImportPTx({
      accountIndex: activeAccount.index,
      sourceChain: 'C',
      avaxXPNetwork,
      destinationAddress: activeAccount.addressPVM,
      feeState
    })
    const tx = await Avalanche.parseAvalancheTx(
      unsignedTxP,
      provider,
      activeAccount.addressPVM
    )
    return new TokenUnit(tx.txFee, 9, 'AVAX')
  }
  return calculatePChainFee(avaxXPNetwork)
}
