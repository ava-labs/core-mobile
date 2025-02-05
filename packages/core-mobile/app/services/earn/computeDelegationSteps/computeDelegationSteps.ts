import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { pvm } from '@avalabs/avalanchejs'
import { getPChainBalance } from 'services/balance/getPChainBalance'
import { weiToNano } from 'utils/units/converter'
import Logger from 'utils/Logger'
import { getCChainBalance } from 'services/balance/getCChainBalance'
import { Step, Operation, Case } from './types'
import {
  getPChainAtomicBalance,
  getExportCFee,
  getImportPFee,
  getImportPFeePostCExport,
  getDelegationFee,
  getDelegationFeePostPImport,
  getDelegationFeePostCExportAndPImport
} from './utils'

const INSUFFICIENT_BALANCE_ERROR = new Error(
  'Insufficient balance for the staking amount and fees.\nKindly adjust the amount accordingly.'
)

export const computeDelegationSteps = async ({
  pAddress,
  stakeAmount,
  currency,
  avaxXPNetwork,
  accountIndex,
  feeState,
  cAddress,
  cChainNetwork,
  cChainBaseFee,
  provider,
  pFeeAdjustmentThreshold,
  pFeeMultiplier,
  cBaseFeeMultiplier
}: {
  pAddress: string
  stakeAmount: bigint
  currency: string
  avaxXPNetwork: Network
  accountIndex: number
  feeState: pvm.FeeState
  cAddress: string
  cChainNetwork: Network
  cChainBaseFee: TokenUnit | undefined
  provider: Avalanche.JsonRpcProvider
  pFeeAdjustmentThreshold: number
  pFeeMultiplier: number
  cBaseFeeMultiplier: number
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Promise<Step[]> => {
  let pChainBalance: bigint | undefined

  try {
    const response = await getPChainBalance({
      pAddress,
      currency,
      avaxXPNetwork
    })
    pChainBalance = response.balancePerType.unlockedUnstaked || 0n
  } catch (e) {
    Logger.error('failed to retrieve P-Chain balance', e)
    throw e
  }

  const pChainAtomicBalance = await getPChainAtomicBalance({
    avaxXPNetwork,
    accountIndex
  })

  const cases: Case[] = [
    {
      title: 'Case 1',
      description: 'Have enough P-Chain balance to stake',
      execute: async () => {
        if (pChainBalance === 0n) {
          throw new Error('no P-Chain balance')
        }

        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFee({
          stakeAmount,
          accountIndex,
          avaxXPNetwork,
          pAddress,
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
          accountIndex,
          avaxXPNetwork,
          pAddress,
          feeState,
          provider
        })

        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFeePostPImport({
          stakeAmount,
          accountIndex,
          avaxXPNetwork,
          pAddress,
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
        const cChainBalance = await getCChainBalance({
          cChainNetwork,
          cAddress,
          currency
        })

        if (cChainBalance === undefined || cChainBalance.balance <= 0)
          throw new Error('no C-Chain balance')

        if (cChainBaseFee === undefined) throw new Error('no C-Chain base fee')

        const exportCFee = await getExportCFee({
          cChainBaseFee,
          accountIndex,
          avaxXPNetwork,
          pAddress,
          cBaseFeeMultiplier
        })

        const importPFee = await getImportPFeePostCExport({
          accountIndex,
          avaxXPNetwork,
          pAddress,
          feeState,
          provider
        })

        // this will throw if P-Chain balance is not enough
        const delegationFee = await getDelegationFeePostCExportAndPImport({
          stakeAmount,
          accountIndex,
          avaxXPNetwork,
          pAddress,
          feeState,
          provider,
          pChainBalance,
          pFeeAdjustmentThreshold
        })

        // we need to check if we have enough balance on C-Chain to transfer
        if (
          weiToNano(cChainBalance.balance) +
            pChainAtomicBalance +
            pChainBalance -
            exportCFee -
            importPFee -
            delegationFee <
          stakeAmount
        ) {
          Logger.error('Case 2.1, 2.2, 3.1, 3.2 failed: insufficient balance')
          throw INSUFFICIENT_BALANCE_ERROR
        }

        Logger.info(
          `applying ${pFeeMultiplier} multiplier to importPFee and delegationFee`
        )

        const adjustedImportPFee = BigInt(
          Math.ceil(Number(importPFee) * (1 + pFeeMultiplier))
        )
        const adjustedDelegationFee = BigInt(
          Math.ceil(Number(delegationFee) * (1 + pFeeMultiplier))
        )

        // add some padding to the amount to transfer to account for the fees (import and delegation fees)
        const amountToTransfer =
          stakeAmount -
          pChainAtomicBalance -
          pChainBalance +
          exportCFee +
          adjustedImportPFee +
          adjustedDelegationFee

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
