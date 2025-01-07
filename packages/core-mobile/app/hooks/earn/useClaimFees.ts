import { useEffect, useMemo, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectPFeeAdjustmentThreshold } from 'store/posthog/slice'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account/slice'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectActiveNetwork } from 'store/network/slice'
import { isDevnet } from 'utils/isDevnet'
import { weiToNano } from 'utils/units/converter'
import { CorePrimaryAccount } from '@avalabs/types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { pvm } from '@avalabs/avalanchejs'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { getAssetId } from 'services/wallet/utils'
import { SendErrorMessage } from 'screens/send/utils/types'
import { usePChainBalance } from './usePChainBalance'
import { useGetFeeState } from './useGetFeeState'
import { extractNeededAmount } from './utils/extractNeededAmount'

/**
 * a hook to calculate the fees needed to do a cross chain transfer from P to C chain
 *
 * formula:
 * total fees = export P fee (constant) + import C fee (dynamic)
 *
 * more info about fees here:
 * https://docs.avax.network/quickstart/transaction-fees
 */
export const useClaimFees = (): {
  totalFees?: TokenUnit
  exportPFee?: TokenUnit
  totalClaimable?: TokenUnit
  defaultTxFee?: TokenUnit
  feeCalculationError?: SendErrorMessage
} => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const pFeeAdjustmentThreshold = useSelector(selectPFeeAdjustmentThreshold)
  const [totalFees, setTotalFees] = useState<TokenUnit>()
  const [exportFee, setExportFee] = useState<TokenUnit>()
  const [defaultTxFee, setDefaultTxFee] = useState<TokenUnit>()
  const [feeCalculationError, setFeeCalculationError] =
    useState<SendErrorMessage>()
  const { defaultFeeState: feeState } = useGetFeeState()
  const pChainBalance = usePChainBalance()
  const xpProvider = useAvalancheXpProvider()
  const cChainBaseFee = useCChainBaseFee()

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(
    isDevMode,
    isDevnet(activeNetwork)
  )

  const totalClaimable = useMemo(() => {
    return pChainBalance?.data?.balancePerType.unlockedUnstaked
      ? new TokenUnit(
          pChainBalance.data.balancePerType.unlockedUnstaked,
          avaxXPNetwork.networkToken.decimals,
          avaxXPNetwork.networkToken.symbol
        )
      : undefined
  }, [
    avaxXPNetwork.networkToken.decimals,
    avaxXPNetwork.networkToken.symbol,
    pChainBalance?.data?.balancePerType.unlockedUnstaked
  ])

  useEffect(() => {
    const getDefaultTxFee = async (): Promise<void> => {
      if (
        activeAccount === undefined ||
        xpProvider === undefined ||
        feeState === undefined ||
        totalClaimable === undefined
      ) {
        return
      }
      const txFee = await getExportPFee({
        amountInNAvax: totalClaimable,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState,
        pFeeAdjustmentThreshold
      })
      setDefaultTxFee(txFee)
    }
    getDefaultTxFee().catch(Logger.error)
  }, [
    activeAccount,
    avaxXPNetwork,
    xpProvider,
    totalClaimable,
    feeState,
    pFeeAdjustmentThreshold
  ])

  useEffect(() => {
    const calculateFees = async (): Promise<void> => {
      if (xpProvider === undefined) return

      if (totalClaimable === undefined) throw new Error('no claimable balance')

      const baseFee = cChainBaseFee?.data
      if (!baseFee) throw new Error('no base fee available')

      if (!activeAccount) throw new Error('no active account')

      const instantBaseFee = WalletService.getInstantBaseFee(baseFee)

      const unsignedTx = await WalletService.createImportCTx({
        accountIndex: activeAccount.index,
        baseFeeInNAvax: weiToNano(instantBaseFee.toSubUnit()),
        avaxXPNetwork,
        sourceChain: 'P',
        destinationAddress: activeAccount.addressC,
        // we only need to validate burned amount
        // when the actual submission happens
        shouldValidateBurnedAmount: false
      })

      const importCFee = calculateCChainFee(instantBaseFee, unsignedTx)

      const exportPFee = await getExportPFee({
        amountInNAvax: totalClaimable,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState,
        pFeeAdjustmentThreshold
      })

      Logger.info('importCFee', importCFee.toDisplay())
      Logger.info('exportPFee', exportPFee.toDisplay())

      const allFees = importCFee.add(exportPFee)

      if (allFees.gt(totalClaimable)) {
        throw SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
      }

      setTotalFees(allFees)
      setExportFee(exportPFee)
    }

    calculateFees()
      .then(() => {
        setFeeCalculationError(undefined)
      })
      .catch(err => {
        Logger.warn(err)
        if (
          (err instanceof Error &&
            err.message
              .toLowerCase()
              .includes('insufficient funds: provided utxos need')) ||
          err === SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE
        ) {
          setFeeCalculationError(SendErrorMessage.INSUFFICIENT_BALANCE_FOR_FEE)
        }
      })
  }, [
    activeAccount,
    isDevMode,
    cChainBaseFee?.data,
    avaxXPNetwork,
    totalClaimable,
    xpProvider,
    feeState,
    pFeeAdjustmentThreshold
  ])

  return {
    totalFees,
    exportPFee: exportFee,
    totalClaimable,
    defaultTxFee,
    feeCalculationError
  }
}

const getExportPFee = async ({
  amountInNAvax,
  activeAccount,
  avaxXPNetwork,
  provider,
  feeState,
  pFeeAdjustmentThreshold
}: {
  amountInNAvax: TokenUnit
  activeAccount: CorePrimaryAccount
  avaxXPNetwork: Network
  provider: Avalanche.JsonRpcProvider
  feeState?: pvm.FeeState
  missingAvax?: bigint
  pFeeAdjustmentThreshold: number
}): Promise<TokenUnit> => {
  if (provider.isEtnaEnabled()) {
    let unsignedTxP
    try {
      unsignedTxP = await WalletService.createExportPTx({
        amountInNAvax: amountInNAvax.toSubUnit(),
        accountIndex: activeAccount.index,
        avaxXPNetwork,
        destinationAddress: activeAccount.addressPVM,
        destinationChain: 'C',
        feeState
      })
    } catch (error) {
      Logger.warn('unable to create export p tx', error)

      const missingAmount = extractNeededAmount(
        (error as Error).message,
        getAssetId(avaxXPNetwork)
      )

      if (!missingAmount) {
        // rethrow error if it's not an insufficient funds error
        throw error
      }

      const amountAvailable = amountInNAvax.toSubUnit()
      const ratio = Number(missingAmount) / Number(amountAvailable)

      if (ratio > pFeeAdjustmentThreshold) {
        // rethrow insufficient funds error when missing fee is too much compared to total token amount
        Logger.error('Failed to simulate export p due to excessive fees', {
          missingAmount,
          ratio
        })
        throw error
      }

      const amountAvailableToClaim = amountAvailable - missingAmount

      if (amountAvailableToClaim <= 0) {
        Logger.error('Failed to simulate export p due to excessive fees', {
          missingAmount
        })
        // rethrow insufficient funds error when balance is not enough to cover fee
        throw error
      }

      unsignedTxP = await WalletService.createExportPTx({
        amountInNAvax: amountAvailableToClaim,
        accountIndex: activeAccount.index,
        avaxXPNetwork,
        destinationAddress: activeAccount.addressPVM,
        destinationChain: 'C',
        feeState
      })
    }

    const tx = await Avalanche.parseAvalancheTx(
      unsignedTxP,
      provider,
      activeAccount.addressPVM
    )

    return new TokenUnit(
      tx.txFee,
      avaxXPNetwork.networkToken.decimals,
      avaxXPNetwork.networkToken.symbol
    )
  }
  return calculatePChainFee(avaxXPNetwork)
}
