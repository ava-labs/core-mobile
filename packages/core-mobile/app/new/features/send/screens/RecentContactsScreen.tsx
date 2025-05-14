import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { RecentContacts } from '../components/RecentContacts'
import { useSendContext } from '../context/sendContext'
import { useSendSelectedToken } from '../store'
import { getAddressByChainId } from '../utils/getAddressByChainId'

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { recentAddresses, contacts, accounts } = useContacts()
  const { resetAmount, setToAddress } = useSendContext()
  const [selectedToken] = useSendSelectedToken()

  const handleSelectContact = useCallback(
    (contact: Contact): void => {
      setToAddress({ to: contact.id, recipientType: contact.type })
      resetAmount()
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/send/send',
        params: { to: contact.id, recipientType: contact.type }
      })
    },
    [navigate, resetAmount, setToAddress]
  )

  const handleGoToQrCode = useCallback((): void => {
    resetAmount()
    // @ts-ignore TODO: make routes typesafe
    navigate('/send/scanQrCode')
  }, [navigate, resetAmount])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      setToAddress({ to: text, recipientType: 'address' })
      resetAmount()
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/send/send',
        params: { to: text, recipientType: 'address' }
      })
    },
    [navigate, resetAmount, setToAddress]
  )

  const recentAddressesBySelectedToken = useMemo(
    () =>
      selectedToken
        ? recentAddresses.filter(
            address =>
              getAddressByChainId({
                contact: address,
                chainId: selectedToken?.networkChainId,
                isDeveloperMode
              }) !== undefined
          )
        : recentAddresses,
    [recentAddresses, selectedToken, isDeveloperMode]
  )

  const contactsBySelectedToken = useMemo(
    () =>
      selectedToken
        ? [...contacts, ...accounts].filter(
            contact =>
              getAddressByChainId({
                contact,
                chainId: selectedToken?.networkChainId,
                isDeveloperMode
              }) !== undefined
          )
        : [...contacts, ...accounts],
    [selectedToken, contacts, accounts, isDeveloperMode]
  )

  return (
    <RecentContacts
      recentAddresses={recentAddressesBySelectedToken}
      contacts={contactsBySelectedToken}
      onGoToQrCode={handleGoToQrCode}
      onSelectContact={handleSelectContact}
      onSubmitEditing={handleSumbitEditing}
    />
  )
}
