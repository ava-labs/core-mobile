import { useGetAmountForCrossChainTransfer } from 'hooks/earn/useGetAmountForCrossChainTransfer'
import { useEffect, useMemo, useState } from 'react'
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
import { useGetFeeState } from './useGetFeeState'

/**
 * useEstimateStakingFee estimates fee by making dummy Export C transaction and
 * then using calculateCChainFee. However, this will happen only if there is
 * some amount to be transferred from C to P chain, which is determined by
 * using useGetAmountForCrossChainTransfer.
 */
export const useEstimateStakingFees = ({
  stakingAmount,
  xpProvider,
  gasPrice
}: {
  stakingAmount: TokenUnit
  xpProvider?: Avalanche.JsonRpcProvider
  gasPrice?: bigint
}): {
  estimatedStakingFee?: TokenUnit
  defaultTxFee?: TokenUnit
  requiredPFee?: TokenUnit
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
  const [requiredPFee, setRequiredPFee] = useState<TokenUnit>()
  const baseFee = useCChainBaseFee().data

  const { getFeeState, defaultFeeState } = useGetFeeState()

  const feeState = useMemo(() => getFeeState(gasPrice), [gasPrice, getFeeState])

  useEffect(() => {
    const getDefaultTxFee = async (): Promise<void> => {
      if (
        amountForCrossChainTransfer === undefined ||
        activeAccount === undefined ||
        xpProvider === undefined ||
        defaultFeeState === undefined
      ) {
        return
      }
      const txFee = await getStakingFeeFromDummyTx({
        stakingAmount,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState: defaultFeeState
      })
      setDefaultTxFee(txFee)
    }
    getDefaultTxFee().catch(Logger.error)
  }, [
    stakingAmount,
    activeAccount,
    avaxXPNetwork,
    amountForCrossChainTransfer,
    defaultFeeState,
    xpProvider
  ])

  useEffect(() => {
    const calculateEstimatedStakingFee = async (): Promise<void> => {
      if (xpProvider === undefined) return

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

      const stakingFee = await getStakingFeeFromDummyTx({
        stakingAmount,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState
      })

      const totalAmount = amountForCrossChainTransfer.add(stakingFee) // we need to include import + addPermissionlessDelegator fee
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
      setRequiredPFee(stakingFee)
      setEstimatedStakingFee(exportFee.add(stakingFee))
    }
    calculateEstimatedStakingFee().catch(Logger.error)
  }, [
    activeAccount,
    amountForCrossChainTransfer,
    avaxXPNetwork,
    baseFee,
    feeState,
    isDevMode,
    stakingAmount,
    xpProvider
  ])

  return {
    estimatedStakingFee,
    defaultTxFee,
    requiredPFee
  }
}

const getStakingFeeFromDummyTx = async ({
  stakingAmount,
  activeAccount,
  avaxXPNetwork,
  provider,
  feeState
}: {
  stakingAmount: TokenUnit
  activeAccount: CorePrimaryAccount
  avaxXPNetwork: Network
  provider: Avalanche.JsonRpcProvider
  feeState?: pvm.FeeState
}): Promise<TokenUnit> => {
  if (provider.isEtnaEnabled() && feeState) {
    const unsignedImportTx = await WalletService.simulateImportPTx({
      stakingAmount: stakingAmount.toSubUnit(),
      accountIndex: activeAccount.index,
      sourceChain: 'C',
      avaxXPNetwork,
      destinationAddress: activeAccount.addressPVM,
      feeState
    })

    const importTx = await Avalanche.parseAvalancheTx(
      unsignedImportTx,
      provider,
      activeAccount.addressPVM
    )
    const unsignedAddPermissionlessDelegatorTx =
      await WalletService.simulateAddPermissionlessDelegatorTx({
        amountInNAvax: stakingAmount.toSubUnit(),
        accountIndex: activeAccount.index,
        destinationChain: 'C',
        avaxXPNetwork,
        destinationAddress: activeAccount.addressPVM,
        feeState
      })

    const addPermissionlessDelegatorTx = await Avalanche.parseAvalancheTx(
      unsignedAddPermissionlessDelegatorTx,
      provider,
      activeAccount.addressPVM
    )
    return new TokenUnit(
      importTx.txFee + addPermissionlessDelegatorTx.txFee,
      avaxXPNetwork.networkToken.decimals,
      avaxXPNetwork.networkToken.symbol
    )
  }
  return calculatePChainFee(avaxXPNetwork)
}
