import React, { useEffect, useMemo } from 'react'
import { useSendContext } from 'contexts/SendContext'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenWithBalanceAVM } from '@avalabs/vm-module-types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import { Contact, CorePrimaryAccount } from '@avalabs/types'
import { getAddressXP } from 'store/utils/account&contactGetters'
import useAVMSend from '../hooks/useAVMSend'
import SendTokenForm from './SendTokenForm'

const SendAVM = ({
  nativeToken,
  network,
  account,
  onOpenQRScanner,
  onOpenAddressBook,
  onSuccess,
  onFailure
}: {
  nativeToken: TokenWithBalanceAVM
  network: Network
  account: CorePrimaryAccount
  onOpenQRScanner: () => void
  onOpenAddressBook: () => void
  onSuccess: (txHash: string) => void
  onFailure: (txError: unknown) => void
}): JSX.Element => {
  const {
    setToAddress,
    token,
    setToken,
    maxAmount,
    error,
    isValid,
    isValidating,
    isSending,
    maxFee
  } = useSendContext()
  const provider = useMemo(
    () => NetworkService.getAvalancheProviderXP(!!network.isTestnet),
    [network]
  )

  const activeAccount = useSelector(selectActiveAccount)

  const fromAddress = activeAccount?.addressAVM ?? ''

  const { send } = useAVMSend({
    network,
    fromAddress,
    provider,
    maxFee,
    nativeToken,
    account
  })

  useEffect(() => {
    setToken(nativeToken)
  }, [nativeToken, setToken])

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
      addressPlaceholder={'Enter AVAX X address'}
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

export default SendAVM
