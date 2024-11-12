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
  xpProvider
}: {
  stakingAmount: TokenUnit
  gasPrice?: bigint
  xpProvider?: Avalanche.JsonRpcProvider
}): {
  estimatedStakingFee?: TokenUnit
  defaultTxFee?: TokenUnit
  defaultGasPrice?: bigint
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
  const [defaultTxFee, setDefaultTxFee] = useState<TokenUnit | undefined>(
    undefined
  )
  const [feeState, setFeeState] = useState<pvm.FeeState | undefined>(undefined)

  const baseFee = useCChainBaseFee().data

  useEffect(() => {
    const fetchFeeState = async (): Promise<void> => {
      if (xpProvider === undefined) return
      const fee = await xpProvider
        .getApiP()
        .getFeeState()
        .catch(() => undefined)
      setFeeState(fee)
    }
    fetchFeeState().catch(Logger.error)
  }, [xpProvider])

  useEffect(() => {
    const getDefaultTxFee = async (): Promise<void> => {
      if (
        amountForCrossChainTransfer === undefined ||
        activeAccount === undefined ||
        xpProvider === undefined ||
        feeState === undefined
      ) {
        return
      }
      const txFee = await getImportFee({
        stakingAmount: amountForCrossChainTransfer.toSubUnit(),
        activeAccount,
        activeNetwork,
        isDynamicFee: true,
        provider: xpProvider,
        feeState
      })
      setDefaultTxFee(txFee)
    }
    getDefaultTxFee().catch(Logger.error)
  }, [
    activeAccount,
    activeNetwork,
    amountForCrossChainTransfer,
    feeState,
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
        stakingAmount: amountForCrossChainTransfer.toSubUnit(),
        activeAccount,
        activeNetwork,
        isDynamicFee: true,
        provider: xpProvider,
        feeState,
        gasPrice
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
    activeNetwork,
    amountForCrossChainTransfer,
    avaxXPNetwork,
    baseFee,
    defaultTxFee,
    feeState,
    gasPrice,
    isDevMode,
    stakingAmount,
    xpProvider
  ])

  return {
    estimatedStakingFee,
    defaultTxFee,
    defaultGasPrice: feeState?.price
  }
}

const getImportFee = async ({
  stakingAmount,
  activeAccount,
  activeNetwork,
  isDynamicFee = false,
  provider,
  gasPrice,
  feeState
}: {
  stakingAmount: bigint
  activeAccount: CorePrimaryAccount
  activeNetwork: Network
  isDynamicFee: boolean
  provider: Avalanche.JsonRpcProvider
  feeState?: pvm.FeeState
  gasPrice?: bigint
}): Promise<TokenUnit> => {
  if (isDynamicFee) {
    const unsignedTxP = await WalletService.createSendPTx({
      accountIndex: activeAccount.index,
      amount: stakingAmount,
      avaxXPNetwork: activeNetwork,
      destinationAddress: activeAccount.addressPVM,
      sourceAddress: activeAccount.addressPVM,
      feeState: feeState
        ? { ...feeState, price: gasPrice ?? feeState.price }
        : undefined
    })
    const tx = await Avalanche.parseAvalancheTx(
      unsignedTxP,
      provider,
      activeAccount.addressPVM
    )
    return new TokenUnit(tx.txFee, 9, 'AVAX')
  }
  return calculatePChainFee(activeNetwork)
}
