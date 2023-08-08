import { Avax } from 'types/Avax'
import { useEffect, useState } from 'react'
import {
  calculateCChainFee,
  calculatePChainFee
} from 'services/earn/calculateCrossChainFees'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import WalletService from 'services/wallet/WalletService'
import { AvalancheTransactionRequest } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { useCChainBaseFee } from 'hooks/useCChainBaseFee'

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
export const useClaimFees = () => {
  const isDevMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const [totalFees, setTotalFees] = useState<Avax | undefined>(undefined)
  const cChainBaseFee = useCChainBaseFee()

  useEffect(() => {
    const calculateFees = async () => {
      const baseFeeRaw = cChainBaseFee?.data
      if (!baseFeeRaw) throw new Error('no base fee available')

      if (!activeAccount) throw new Error('no active acocunt')

      const baseFee = Avax.fromWei(baseFeeRaw)

      const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDevMode)

      const instantBaseFee = WalletService.getInstantBaseFee(baseFee)

      const unsignedTx = await WalletService.createImportCTx({
        accountIndex: activeAccount.index,
        baseFee: instantBaseFee,
        avaxXPNetwork,
        sourceChain: 'P',
        destinationAddress: activeAccount.address,
        // we only need to validate burned amount
        // when the actual submission happens
        shouldValidateBurnedAmount: false
      })

      const signedTxJson = await WalletService.sign(
        { tx: unsignedTx } as AvalancheTransactionRequest,
        activeAccount.index,
        avaxXPNetwork
      )

      const signedTx = UnsignedTx.fromJSON(signedTxJson).getSignedTx()

      const importCFee = calculateCChainFee(
        instantBaseFee,
        unsignedTx,
        signedTx
      )

      Logger.info('importCFee', importCFee.toDisplay())
      Logger.info('exportPFee', exportPFee.toDisplay())
      setTotalFees(importCFee.add(exportPFee))
    }

    calculateFees().catch(err => {
      Logger.error(err)
    })
  }, [activeAccount, isDevMode, cChainBaseFee?.data])

  return { totalFees, exportPFee }
}
