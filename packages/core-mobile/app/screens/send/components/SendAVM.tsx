import React from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { CorePrimaryAccount } from '@avalabs/types'
import useAVMSend from '../hooks/useAVMSend'
import SendTokenForm from './SendTokenForm'

const SendAVM = ({
  nativeToken,
  network,
  account,
  onOpenQRScanner,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceAVM
  network: Network
  account: CorePrimaryAccount
  onOpenQRScanner: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { token, maxAmount, error, isValid, isSending, maxFee } =
    useSendContext()
  const activeAccount = useSelector(selectActiveAccount)

  const fromAddress = activeAccount?.addressAVM ?? ''

  const { send } = useAVMSend({
    network,
    fromAddress,
    maxFee,
    nativeToken,
    account
  })

  const handleSend = async (): Promise<void> => {
    if (token === undefined) {
      return
    }

    try {
      const txHash = await send()

      onSuccess(txHash)
    } catch (reason) {
      onFailure(reason)
    }
  }

  return (
    <SendTokenForm
      network={network}
      maxAmount={maxAmount}
      addressPlaceholder={'Enter AVAX X address'}
      error={error}
      isValid={isValid}
      isSending={isSending}
      onOpenQRScanner={onOpenQRScanner}
      onSend={handleSend}
    />
  )
}

export default SendAVM
