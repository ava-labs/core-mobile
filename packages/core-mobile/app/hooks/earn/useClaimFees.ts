import { useEffect, useState } from 'react'
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
import { weiToNano } from 'utils/units/converter'

const exportPFee = calculatePChainFee()

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
  totalFees: TokenUnit | undefined
  exportPFee: TokenUnit
} => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const [totalFees, setTotalFees] = useState<TokenUnit | undefined>(undefined)
  const cChainBaseFee = useCChainBaseFee()

  useEffect(() => {
    const calculateFees = async (): Promise<void> => {
      const baseFee = cChainBaseFee?.data
      if (!baseFee) throw new Error('no base fee available')

      if (!activeAccount) throw new Error('no active account')

      const avaxXPNetwork = NetworkService.getAvalancheNetworkP(isDevMode)

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

      Logger.info('importCFee', importCFee.toDisplay())
      Logger.info('exportPFee', exportPFee.toDisplay())
      setTotalFees(importCFee.add(exportPFee))
    }

    calculateFees().catch(err => {
      Logger.error(err)
    })
  }, [activeAccount, isDevMode, cChainBaseFee?.data])

  return { totalFees: totalFees, exportPFee }
}
