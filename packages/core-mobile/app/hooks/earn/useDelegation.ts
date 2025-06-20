import { useCallback, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'
import {
  selectPFeeAdjustmentThreshold,
  selectCrossChainFeesMultiplier,
  selectCBaseFeeMultiplier
} from 'store/posthog/slice'
import { computeDelegationSteps } from 'services/earn/computeDelegationSteps/computeDelegationSteps'
import {
  Operation,
  type Step
} from 'services/earn/computeDelegationSteps/types'
import NetworkService from 'services/network/NetworkService'
import { useGetFeeState } from 'hooks/earn/useGetFeeState'
import { nanoToWei } from 'utils/units/converter'
import { exportC } from 'services/earn/exportC'
import { importP } from 'services/earn/importP'
import EarnService from 'services/earn/EarnService'
import { type Compute, type Delegate } from 'contexts/DelegationContext'
import Logger from 'utils/Logger'
import { useActiveAccount } from 'common/hooks/useActiveAccount'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useAvalancheXpProvider } from '../networks/networkProviderHooks'
import useCChainNetwork from './useCChainNetwork'

const EMPTY_STEPS: Step[] = []

export const useDelegation = (): {
  compute: Compute
  delegate: Delegate
  steps: Step[]
  networkFees: bigint
} => {
  const [steps, setSteps] = useState<Step[]>(EMPTY_STEPS)
  const cChainBalance = useCChainBalance()
  const activeWallet = useActiveWallet()
  const activeAccount = useActiveAccount()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const pFeeAdjustmentThreshold = useSelector(selectPFeeAdjustmentThreshold)
  const crossChainFeesMultiplier = useSelector(selectCrossChainFeesMultiplier)
  const cBaseFeeMultiplier = useSelector(selectCBaseFeeMultiplier)
  const { defaultFeeState } = useGetFeeState()
  const cChainNetwork = useCChainNetwork()
  const avaxProvider = useAvalancheXpProvider(isDeveloperMode)
  const cChainBaseFee = useCChainBaseFee()

  const networkFees = useMemo(
    () =>
      steps.reduce((sum, transaction) => {
        return sum + transaction.fee
      }, BigInt(0)),
    [steps]
  )

  const compute: Compute = useCallback(
    async (stakeAmount: bigint) => {
      if (
        !activeAccount ||
        !defaultFeeState ||
        !cChainBaseFee.data ||
        !avaxProvider ||
        !cChainNetwork
      )
        return EMPTY_STEPS

      const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)

      const result = await computeDelegationSteps({
        walletId: activeWallet.id,
        walletType: activeWallet.type,
        pAddress: activeAccount.addressPVM,
        cAddress: activeAccount.addressC,
        currency: selectedCurrency,
        accountIndex: activeAccount.index,
        avaxXPNetwork: network,
        cChainNetwork,
        provider: avaxProvider,
        pFeeAdjustmentThreshold,
        cBaseFeeMultiplier,
        cChainBaseFee: cChainBaseFee.data,
        feeState: defaultFeeState,
        stakeAmount: stakeAmount,
        crossChainFeesMultiplier
      })

      setSteps(result)
      return result
    },
    [
      activeWallet,
      cChainNetwork,
      activeAccount,
      cChainBaseFee.data,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      cBaseFeeMultiplier,
      crossChainFeesMultiplier,
      selectedCurrency,
      avaxProvider
    ]
  )

  const delegate: Delegate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    async ({ steps, startDate, endDate, nodeId }) => {
      if (activeAccount === undefined) {
        throw new Error('No active account')
      }

      if (steps.length === 0) {
        throw new Error('An unexpected error occurred. Please retry.')
      }

      Logger.info(
        'Processing the following steps:',
        JSON.stringify(steps, null, 2)
      )

      let txHash

      for (const step of steps) {
        switch (step.operation) {
          case Operation.DELEGATE:
            Logger.info(
              `delegating ${step.amount} with estimated fee ${step.fee}`
            )

            txHash = await EarnService.issueAddDelegatorTransaction({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              activeAccount,
              endDate,
              isDevMode: isDeveloperMode,
              nodeId,
              stakeAmountNanoAvax: step.amount,
              startDate: startDate,
              feeState: defaultFeeState,
              pFeeAdjustmentThreshold
            })
            break

          case Operation.IMPORT_P:
            Logger.info(`importing P-Chain with estimated fee ${step.fee}`)

            await importP({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              activeAccount,
              selectedCurrency,
              isDevMode: isDeveloperMode,
              feeState: defaultFeeState
            })
            break

          case Operation.EXPORT_C:
            Logger.info(
              `exporting from C-Chain with amount ${step.amount} and estimated fee ${step.fee}`
            )

            await exportC({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              cChainBalanceWei: cChainBalance.data?.balance || 0n,
              requiredAmountWei: nanoToWei(step.amount),
              activeAccount,
              isDevMode: isDeveloperMode,
              cBaseFeeMultiplier
            })
            break

          default:
            throw new Error(`unknown step: ${step}`)
        }
      }

      if (!txHash) {
        throw new Error('No transaction hash found')
      }

      Logger.info('All delegation steps processed successfully.')
      return txHash
    },
    [
      activeWallet,
      activeAccount,
      cChainBalance.data?.balance,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      selectedCurrency,
      cBaseFeeMultiplier
    ]
  )

  return { compute, delegate, steps, networkFees }
}
