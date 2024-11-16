import React from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalancePVM } from '@avalabs/vm-module-types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Contact, CorePrimaryAccount } from '@avalabs/types'
import { getAddressXP } from 'store/utils/account&contactGetters'
import usePVMSend from '../hooks/usePVMSend'
import SendTokenForm from './SendTokenForm'

const SendPVM = ({
  nativeToken,
  network,
  account,
  onOpenQRScanner,
  onOpenAddressBook,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalancePVM
  network: Network
  account: CorePrimaryAccount
  onOpenQRScanner: () => void
  onOpenAddressBook: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const { setToAddress, token, maxAmount, error, isValid, isSending, maxFee } =
    useSendContext()
  const activeAccount = useSelector(selectActiveAccount)

  const fromAddress = activeAccount?.addressPVM ?? ''

  const { send } = usePVMSend({
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

  const handleSelectContact = (item: Contact | CorePrimaryAccount): void => {
    setToAddress(getAddressXP(item) ?? '')
  }

  return (
    <SendTokenForm
      network={network}
      maxAmount={maxAmount}
      addressPlaceholder={'Enter AVAX P address'}
      error={error}
      isValid={isValid}
      isSending={isSending}
      onOpenQRScanner={onOpenQRScanner}
      onOpenAddressBook={onOpenAddressBook}
      onSelectContact={handleSelectContact}
      onSend={handleSend}
    />
  )
}

export default SendPVM
