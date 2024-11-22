import { useEffect, useMemo, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectActiveNetwork } from 'store/network'
import { isDevnet } from 'utils/isDevnet'
import { weiToNano } from 'utils/units/converter'
import { CorePrimaryAccount } from '@avalabs/types'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { pvm } from '@avalabs/avalanchejs'
import { useAvalancheXpProvider } from 'hooks/networks/networkProviderHooks'
import { usePChainBalance } from './usePChainBalance'
import { useGetFeeState } from './useGetFeeState'

/**
 * a hook to calculate the fees needed to do a cross chain transfer from P to C chain
 *
 * formula:
 * total fees = export P fee (constant) + import C fee (dynamic)
 *
 * more info about fees here:
 * https://docs.avax.network/quickstart/transaction-fees
 */
export const useClaimFees = (
  gasPrice?: bigint
): {
  totalFees?: TokenUnit
  exportPFee?: TokenUnit
  totalClaimable?: TokenUnit
  defaultTxFee?: TokenUnit
} => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const [totalFees, setTotalFees] = useState<TokenUnit>()
  const [exportFee, setExportFee] = useState<TokenUnit>()
  const [defaultTxFee, setDefaultTxFee] = useState<TokenUnit>()
  const { getFeeState, defaultFeeState } = useGetFeeState()
  const pChainBalance = usePChainBalance()
  const xpProvider = useAvalancheXpProvider()
  const cChainBaseFee = useCChainBaseFee()

  const avaxXPNetwork = NetworkService.getAvalancheNetworkP(
    isDevMode,
    isDevnet(activeNetwork)
  )

  const feeState = useMemo(() => getFeeState(gasPrice), [getFeeState, gasPrice])

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
        defaultFeeState === undefined ||
        totalClaimable === undefined
      ) {
        return
      }
      const txFee = await getExportFeeFromDummyTx({
        amountInNAvax: totalClaimable,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState: defaultFeeState
      })
      setDefaultTxFee(txFee)
    }
    getDefaultTxFee().catch(Logger.error)
  }, [
    activeAccount,
    avaxXPNetwork,
    xpProvider,
    totalClaimable,
    defaultFeeState
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
      const exportPFee = await getExportFeeFromDummyTx({
        amountInNAvax: totalClaimable,
        activeAccount,
        avaxXPNetwork,
        provider: xpProvider,
        feeState
      })

      Logger.info('importCFee', importCFee.toDisplay())
      Logger.info('exportPFee', exportPFee.toDisplay())
      setTotalFees(importCFee.add(exportPFee))
      setExportFee(exportPFee)
    }

    calculateFees().catch(err => {
      Logger.error(err)
    })
  }, [
    activeAccount,
    isDevMode,
    cChainBaseFee?.data,
    avaxXPNetwork,
    totalClaimable,
    xpProvider,
    feeState
  ])

  return {
    totalFees,
    exportPFee: exportFee,
    totalClaimable,
    defaultTxFee
  }
}

const getExportFeeFromDummyTx = async ({
  amountInNAvax,
  activeAccount,
  avaxXPNetwork,
  provider,
  feeState
}: {
  amountInNAvax: TokenUnit
  activeAccount: CorePrimaryAccount
  avaxXPNetwork: Network
  provider: Avalanche.JsonRpcProvider
  feeState?: pvm.FeeState
}): Promise<TokenUnit> => {
  if (provider.isEtnaEnabled()) {
    const unsignedTxP = await WalletService.createDummyExportPTx({
      amountInNAvax: amountInNAvax.toSubUnit(),
      accountIndex: activeAccount.index,
      avaxXPNetwork,
      destinationAddress: activeAccount.addressPVM,
      destinationChain: 'C',
      feeState
    })
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
