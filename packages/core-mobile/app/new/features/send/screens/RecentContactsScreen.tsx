import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { RecentContacts } from '../components/RecentContacts'
import { useSendContext } from '../context/sendContext'

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { recentAddresses, contacts, accounts } = useContacts()
  const { resetAmount } = useSendContext()

  const handleSelectContact = useCallback(
    (contact: Contact): void => {
      resetAmount()
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/send/send',
        params: { to: contact.id, recipientType: contact.type }
      })
    },
    [navigate, resetAmount]
  )

  const handleGoToQrCode = useCallback((): void => {
    resetAmount()
    // @ts-ignore TODO: make routes typesafe
    navigate('/send/scanQrCode')
  }, [navigate, resetAmount])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/send/send',
        params: { to: text, recipientType: 'address' }
      })
    },
    [navigate]
  )

  return (
    <RecentContacts
      recentAddresses={recentAddresses}
      contacts={[...contacts, ...accounts]}
      onGoToQrCode={handleGoToQrCode}
      onSelectContact={handleSelectContact}
      onSubmitEditing={handleSumbitEditing}
    />
  )
}
