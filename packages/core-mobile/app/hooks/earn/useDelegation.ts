import { useCallback, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'
import { selectActiveNetwork } from 'store/network/slice'
import {
  selectPFeeAdjustmentThreshold,
  selectPFeeMultiplier
} from 'store/posthog/slice'
import { isDevnet } from 'utils/isDevnet'
import { selectActiveAccount } from 'store/account/slice'
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
  const activeNetwork = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const pFeeAdjustmentThreshold = useSelector(selectPFeeAdjustmentThreshold)
  const pFeeMultiplier = useSelector(selectPFeeMultiplier)
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
  const isDevNetwork = isDevnet(activeNetwork)

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

      const network = NetworkService.getAvalancheNetworkP(
        isDeveloperMode,
        isDevNetwork
      )

      const result = await computeDelegationSteps({
        pAddress: activeAccount.addressPVM,
        cAddress: activeAccount.addressC,
        currency: selectedCurrency,
        accountIndex: activeAccount.index,
        avaxXPNetwork: network,
        cChainNetwork,
        provider: avaxProvider,
        pFeeAdjustmentThreshold,
        pFeeMultiplier,
        cChainBaseFee: cChainBaseFee.data,
        feeState: defaultFeeState,
        stakeAmount: stakeAmount
      })

      setSteps(result)
      return result
    },
    [
      cChainNetwork,
      activeAccount,
      isDevNetwork,
      cChainBaseFee.data,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      pFeeMultiplier,
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
        throw new Error('No valid delegation steps found')
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
              activeAccount,
              endDate,
              isDevMode: isDeveloperMode,
              nodeId,
              stakeAmountNanoAvax: step.amount,
              startDate: startDate,
              isDevnet: isDevNetwork,
              feeState: defaultFeeState,
              pFeeAdjustmentThreshold
            })
            break

          case Operation.IMPORT_P:
            Logger.info(`importing P-Chain with estimated fee ${step.fee}`)

            await importP({
              activeAccount,
              selectedCurrency,
              isDevMode: isDeveloperMode,
              isDevnet: isDevNetwork,
              feeState: defaultFeeState
            })
            break

          case Operation.EXPORT_C:
            Logger.info(
              `exporting from C-Chain with amount ${step.amount} and estimated fee ${step.fee}`
            )

            await exportC({
              cChainBalanceWei: cChainBalance.data?.balance || 0n,
              requiredAmountWei: nanoToWei(step.amount),
              activeAccount,
              isDevMode: isDeveloperMode,
              isDevnet: isDevNetwork
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
      activeAccount,
      isDevNetwork,
      cChainBalance.data?.balance,
      defaultFeeState,
      isDeveloperMode,
      pFeeAdjustmentThreshold,
      selectedCurrency
    ]
  )

  return { compute, delegate, steps, networkFees }
}
