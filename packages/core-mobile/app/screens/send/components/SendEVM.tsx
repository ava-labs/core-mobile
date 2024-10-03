import React, { useMemo } from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import { NetworkTokenWithBalance } from '@avalabs/vm-module-types'
import { Contact, CorePrimaryAccount } from '@avalabs/types'
import { getAddressProperty } from 'store/utils/account&contactGetters'
import useEVMSend from '../hooks/useEVMSend'
import SendTokenForm from './SendTokenForm'

const SendEVM = ({
  account,
  nativeToken,
  network,
  onOpenQRScanner,
  onOpenAddressBook,
  onSuccess,
  onFailure
}: {
  account: CorePrimaryAccount
  nativeToken: NetworkTokenWithBalance
  network: Network
  onOpenQRScanner: () => void
  onOpenAddressBook: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const {
    setToAddress,
    token,
    maxAmount,
    error,
    isValid,
    isValidating,
    isSending,
    maxFee
  } = useSendContext()
  const provider = useMemo(() => getEvmProvider(network), [network])

  const fromAddress = account?.addressC ?? ''

  const { send } = useEVMSend({
    chainId: network.chainId,
    fromAddress,
    provider,
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

  const handleSelectContact = (item: Contact | CorePrimaryAccount): void => {
    setToAddress(getAddressProperty(item))
  }

  return (
    <SendTokenForm
      network={network}
      maxAmount={maxAmount}
      addressPlaceholder={'Enter 0x Address'}
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

export default SendEVM
