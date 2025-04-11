import React from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { NetworkTokenWithBalance } from '@avalabs/vm-module-types'
import { CorePrimaryAccount } from '@avalabs/types'
import useEVMSend from '../hooks/useEVMSend'
import SendTokenForm from './SendTokenForm'

const SendEVM = ({
  account,
  nativeToken,
  network,
  onOpenQRScanner,
  onSuccess,
  onFailure
}: {
  account: CorePrimaryAccount
  nativeToken: NetworkTokenWithBalance
  network: Network
  onOpenQRScanner: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { token, maxAmount, error, isValid, isSending, maxFee } =
    useSendContext()
  const fromAddress = account?.addressC ?? ''

  const { send } = useEVMSend({
    chainId: network.chainId,
    fromAddress,
    network,
    maxFee,
    nativeToken
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
      addressPlaceholder={'Enter 0x Address'}
      error={error}
      isValid={isValid}
      isSending={isSending}
      onOpenQRScanner={onOpenQRScanner}
      onSend={handleSend}
    />
  )
}

export default SendEVM
