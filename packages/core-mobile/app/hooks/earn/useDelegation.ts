import { useCallback, useState } from 'react'
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
import { type ComputeSteps, type Delegate } from 'contexts/DelegationContext'
import Logger from 'utils/Logger'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { selectActiveAccount } from 'store/account'
import { getMinimumStakeDurationMs } from 'services/earn/utils'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'
import {
  useAvalancheEvmProvider,
  useAvalancheXpProvider
} from '../networks/networkProviderHooks'
import { usePChainBalance } from './usePChainBalance'

const EMPTY_STEPS: Step[] = []

export const useDelegation = (): {
  computeSteps: ComputeSteps
  delegate: Delegate
  steps: Step[]
} => {
  const [steps, setSteps] = useState<Step[]>(EMPTY_STEPS)
  const cChainBalance = useCChainBalance()
  const activeWallet = useActiveWallet()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const pFeeAdjustmentThreshold = useSelector(selectPFeeAdjustmentThreshold)
  const crossChainFeesMultiplier = useSelector(selectCrossChainFeesMultiplier)
  const cBaseFeeMultiplier = useSelector(selectCBaseFeeMultiplier)
  const { defaultFeeState } = useGetFeeState()
  const { xpAddresses, xpAddressDictionary } = useXPAddresses(activeAccount)
  const avaxProvider = useAvalancheXpProvider(isDeveloperMode)
  const avalancheEvmProvider = useAvalancheEvmProvider(isDeveloperMode)
  const cChainBaseFee = useCChainBaseFee()
  const pChainBalance = usePChainBalance()

  const computeSteps: ComputeSteps = useCallback(
    async (stakeAmount: bigint) => {
      if (
        !activeAccount ||
        !activeAccount.addressPVM ||
        !activeAccount.addressC ||
        !defaultFeeState ||
        !cChainBaseFee.data ||
        !avaxProvider ||
        !avalancheEvmProvider
      )
        return EMPTY_STEPS

      const network = NetworkService.getAvalancheNetworkP(isDeveloperMode)

      const result = await computeDelegationSteps({
        account: activeAccount,
        pChainBalance,
        cChainBalance,
        avaxXPNetwork: network,
        provider: avaxProvider,
        pFeeAdjustmentThreshold,
        cBaseFeeMultiplier,
        cChainBaseFee: cChainBaseFee.data,
        feeState: defaultFeeState,
        stakeAmount,
        crossChainFeesMultiplier,
        avalancheEvmProvider,
        xpAddresses
      })

      setSteps(result)
      return result
    },
    [
      cChainBalance,
      pChainBalance,
      activeAccount,
      cChainBaseFee.data,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      cBaseFeeMultiplier,
      crossChainFeesMultiplier,
      avaxProvider,
      avalancheEvmProvider,
      xpAddresses
    ]
  )

  const delegate: Delegate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    async ({ steps, startDate, endDate, nodeId, onProgress }) => {
      if (activeAccount === undefined) {
        throw new Error('No active account')
      }

      if (!avalancheEvmProvider) {
        throw new Error('No avalanche EVM provider')
      }

      if (steps.length === 0) {
        throw new Error('An unexpected error occurred. Please retry.')
      }

      Logger.info(
        'Processing the following steps:',
        JSON.stringify(steps, null, 2)
      )

      setSteps(steps)

      let txHash
      let stepIndex = 0

      // Show the first operation before starting
      const firstStep = steps[0]
      if (firstStep) {
        onProgress?.(0, firstStep.operation)
      }

      for (const step of steps) {
        switch (step.operation) {
          case Operation.DELEGATE: {
            Logger.info(
              `delegating ${step.amount} with estimated fee ${step.fee}`
            )

            // always use current date + 1 minute for the start date
            // the recompute step logic could take a while, so we need to ensure the start date is not in the past
            // otherwise, the transaction will fail with a "Start date must be in future" error
            const delegateStartDate = new Date(Date.now() + 1 * 60 * 1000)

            // get the difference in milliseconds between the original start date and the fresh start date
            const differenceInMilliseconds =
              delegateStartDate.getTime() - startDate.getTime()

            const minimumStakeDurationMs =
              getMinimumStakeDurationMs(isDeveloperMode)

            const isStakingMinimumDuration =
              endDate.getTime() - startDate.getTime() <= minimumStakeDurationMs

            // add the difference in milliseconds to the original end date, so the duration is the same as the original
            const delegateEndDate = new Date(
              endDate.getTime() +
                (isStakingMinimumDuration ? differenceInMilliseconds : 0)
            )

            txHash = await EarnService.issueAddDelegatorTransaction({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              account: activeAccount,
              endDate: delegateEndDate,
              isTestnet: isDeveloperMode,
              nodeId,
              stakeAmountNanoAvax: step.amount,
              startDate: delegateStartDate,
              feeState: defaultFeeState,
              pFeeAdjustmentThreshold,
              xpAddresses,
              xpAddressDictionary
            })
            break
          }
          case Operation.IMPORT_P:
            Logger.info(`importing P-Chain with estimated fee ${step.fee}`)

            await importP({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              account: activeAccount,
              selectedCurrency,
              isTestnet: isDeveloperMode,
              feeState: defaultFeeState,
              xpAddresses,
              xpAddressDictionary
            })
            break

          case Operation.EXPORT_C:
            Logger.info(
              `exporting from C-Chain with amount ${step.amount} and estimated fee ${step.fee}`
            )

            await exportC({
              walletId: activeWallet.id,
              walletType: activeWallet.type,
              cChainBalanceWei: cChainBalance?.toSubUnit() || 0n,
              requiredAmountWei: nanoToWei(step.amount),
              account: activeAccount,
              isTestnet: isDeveloperMode,
              cBaseFeeMultiplier,
              avalancheEvmProvider,
              xpAddresses
            })
            break

          default:
            throw new Error(`unknown step: ${step}`)
        }

        // Update progress after operation completes
        // Use setTimeout pattern (proven successful in commit 0c60ac513)
        // This ensures React Native has time to flush state updates before next operation
        stepIndex++
        const nextStep = steps[stepIndex]

        await new Promise<void>(resolve => {
          setTimeout(() => {
            onProgress?.(stepIndex, nextStep?.operation ?? null)
            resolve()
          }, 10)
        })
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
      cChainBalance,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      selectedCurrency,
      cBaseFeeMultiplier,
      avalancheEvmProvider,
      xpAddresses,
      xpAddressDictionary
    ]
  )

  return { computeSteps, delegate, steps }
}
