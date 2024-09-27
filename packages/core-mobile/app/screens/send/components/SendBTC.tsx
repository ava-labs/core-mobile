import React, { useEffect, useMemo } from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { TokenWithBalanceBTC } from '@avalabs/vm-module-types'
import { Contact, CorePrimaryAccount } from '@avalabs/types'
import useBTCSend from '../hooks/useBTCSend'
import SendTokenForm from './SendTokenForm'

const SendBTC = ({
  nativeToken,
  account,
  network,
  onOpenQRScanner,
  onOpenAddressBook,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceBTC
  account: CorePrimaryAccount
  network: Network
  onOpenQRScanner: () => void
  onOpenAddressBook: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const {
    setToAddress,
    setToken,
    maxAmount,
    error,
    isValid,
    isValidating,
    isSending,
    maxFee
  } = useSendContext()
  const provider = useMemo(
    () => getBitcoinProvider(network.isTestnet),
    [network]
  )

  const fromAddress = account?.addressBTC ?? ''

  const { send } = useBTCSend({
    fromAddress,
    isMainnet: !network.isTestnet,
    provider,
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

  const handleSelectContact = (item: Contact | CorePrimaryAccount): void => {
    setToAddress(item.addressBTC ?? '')
  }

  return (
    <SendTokenForm
      network={network}
      maxAmount={maxAmount}
      addressPlaceholder={'Enter Bitcoin Address'}
      error={error}
      isValid={isValid}
      isSending={isSending}
      isValidating={isValidating}
      onOpenQRScanner={onOpenQRScanner}
      onOpenAddressBook={onOpenAddressBook}
      onSelectContact={handleSelectContact}
      onSend={handleSend}
    />
  )
}

export default SendBTC
