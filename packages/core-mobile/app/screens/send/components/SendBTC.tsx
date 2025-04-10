import React, { useEffect } from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
import { CorePrimaryAccount } from '@avalabs/types'
import useBTCSend from '../hooks/useBTCSend'
import SendTokenForm from './SendTokenForm'

const SendBTC = ({
  nativeToken,
  account,
  network,
  onOpenQRScanner,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceBTC
  account: CorePrimaryAccount
  network: Network
  onOpenQRScanner: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { setToken, maxAmount, error, isValid, isSending, maxFee } =
    useSendContext()

  const fromAddress = account?.addressBTC ?? ''

  const { send } = useBTCSend({
    fromAddress,
    isMainnet: !network.isTestnet,
    network,
    maxFee,
    nativeToken
  })

  useEffect(() => {
    setToken(nativeToken)
  }, [nativeToken, setToken])

  const handleSend = async (): Promise<void> => {
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
      addressPlaceholder={'Enter Bitcoin Address'}
      error={error}
      isValid={isValid}
      isSending={isSending}
      onOpenQRScanner={onOpenQRScanner}
      onSend={handleSend}
    />
  )
}

export default SendBTC
