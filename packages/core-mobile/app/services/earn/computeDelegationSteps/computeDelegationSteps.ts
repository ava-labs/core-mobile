import { Avalanche, JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { pvm } from '@avalabs/avalanchejs'
import { weiToNano } from 'utils/units/converter'
import Logger from 'utils/Logger'
import { Account } from 'store/account'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { Step, Operation, Case } from './types'
import {
  getPChainAtomicBalance,
  getExportCFee,
  getImportPFee,
  getImportPFeePostCExport,
  getDelegationFee,
  getDelegationFeePostPImport,
  getDelegationFeePostCExportAndPImport,
  bigIntDiff
} from './utils'

const INSUFFICIENT_BALANCE_ERROR = new Error(
  'Insufficient balance for the stake amount and fees.\nKindly adjust the amount accordingly.'
)

export const computeDelegationSteps = async ({
  stakeAmount,
  cChainBalance,
  pChainBalance,
  avaxXPNetwork,
  account,
  feeState,
  cChainBaseFee,
  provider,
  pFeeAdjustmentThreshold,
  cBaseFeeMultiplier,
  crossChainFeesMultiplier,
  avalancheEvmProvider
}: {
  stakeAmount: bigint
  avaxXPNetwork: Network
  account: Account
  feeState: pvm.FeeState
  pChainBalance: TokenWithBalancePVM | undefined
  cChainBalance: TokenUnit | undefined
  cChainBaseFee: TokenUnit | undefined
  provider: Avalanche.JsonRpcProvider
  avalancheEvmProvider: JsonRpcBatchInternal
  pFeeAdjustmentThreshold: number
  cBaseFeeMultiplier: number
  crossChainFeesMultiplier: number
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Promise<Step[]> => {
  const availablePChainBalance =
    pChainBalance?.balancePerType.unlockedUnstaked ?? 0n
  const isTestnet = Boolean(avaxXPNetwork.isTestnet)
  const pChainAtomicBalance = await getPChainAtomicBalance({
    isTestnet,
    account
  })

  const cases: Case[] = [
    {
      title: 'Case 1',
      description: 'Have enough P-Chain balance to stake',
      execute: async () => {
        if (availablePChainBalance === 0n) {
          throw new Error('no P-Chain balance')
        }

        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFee({
          stakeAmount,
          account,
          isTestnet,
          rewardAddress: account.addressPVM,
          feeState,
          provider,
          pFeeAdjustmentThreshold
        })

        return [
          {
            operation: Operation.DELEGATE,
            amount: stakeAmount,
            fee: delegationFee
          }
        ]
      }
    },
    {
      title: 'Combined Cases 2.3, 3.3',
      description:
        'P-Chain atomic balance combined with P-Chain balance (if available) is enough to stake',
      execute: async () => {
        if (pChainAtomicBalance <= 0)
          throw new Error('no P-Chain atomic balance')

        const importPFee = await getImportPFee({
          account,
          isTestnet,
          destinationAddress: account.addressPVM,
          feeState,
          provider
        })

        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFeePostPImport({
          stakeAmount,
          account,
          isTestnet,
          feeState,
          pChainAtomicBalance,
          importPFee,
          provider
        })

        return [
          { operation: Operation.IMPORT_P, fee: importPFee },
          {
            operation: Operation.DELEGATE,
            amount: stakeAmount,
            fee: delegationFee
          }
        ]
      }
    },
    {
      title: 'Combined Cases 2.1, 2.2, 3.1, 3.2',
      description:
        'Not enough balance on P-Chain to stake. Need to transfer from C-Chain.',
      execute: async () => {
        if (cChainBalance === undefined || cChainBalance.toSubUnit() <= 0)
          throw new Error('no C-Chain balance')

        if (cChainBaseFee === undefined) throw new Error('no C-Chain base fee')

        const exportCFee = await getExportCFee({
          cChainBaseFee,
          account,
          isTestnet,
          cBaseFeeMultiplier,
          avalancheEvmProvider
        })

        const importPFee = await getImportPFeePostCExport({
          account,
          isTestnet,
          feeState,
          provider
        })
        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFeePostCExportAndPImport({
          stakeAmount,
          account,
          isTestnet,
          feeState,
          provider,
          pChainBalance: availablePChainBalance,
          pFeeAdjustmentThreshold
        })

        Logger.info(
          `applying ${crossChainFeesMultiplier} multiplier to all fees`
        )

        // add some padding to the fees before calculating the amount to transfer
        const adjustedAllFees = BigInt(
          Math.ceil(
            Number(exportCFee + importPFee + delegationFee) *
              (1 + crossChainFeesMultiplier)
          )
        )

        const amountToTransfer =
          bigIntDiff(stakeAmount, availablePChainBalance) -
          pChainAtomicBalance +
          adjustedAllFees

        // we need to check if we have enough balance on C-Chain to transfer
        if (amountToTransfer >= weiToNano(cChainBalance.toSubUnit())) {
          Logger.error('Case 2.1, 2.2, 3.1, 3.2 failed: insufficient balance')
          throw INSUFFICIENT_BALANCE_ERROR
        }

        return [
          {
            operation: Operation.EXPORT_C,
            amount: amountToTransfer,
            fee: exportCFee
          },
          { operation: Operation.IMPORT_P, fee: importPFee },
          {
            operation: Operation.DELEGATE,
            amount: stakeAmount,
            fee: delegationFee
          }
        ]
      }
    }
  ]

  let steps: Step[] = []

  for (const { title, description, execute } of cases) {
    try {
      Logger.info(`attempting ${title}: ${description}`)
      steps = await execute()

      if (steps) break
    } catch (error) {
      Logger.info(`${title} failed with error: ${(error as Error).message}`)
    }
  }

  if (steps.length === 0) throw INSUFFICIENT_BALANCE_ERROR

  return steps
}
