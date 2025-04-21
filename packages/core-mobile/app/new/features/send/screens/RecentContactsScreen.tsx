import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { useSendSelectedToken } from '../store'
import { RecentContacts } from '../components/RecentContacts'

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { recentAddresses, contacts, accounts } = useContacts()
  const [_, setSelectedToken] = useSendSelectedToken()

  const handleSelectContact = useCallback(
    (contact: Contact): void => {
      setSelectedToken(undefined)
      navigate({
        pathname: '/send/send',
        params: { to: contact.id, recipientType: 'contact' }
      })
    },
    [navigate, setSelectedToken]
  )

  const handleGoToQrCode = useCallback((): void => {
    setSelectedToken(undefined)
    navigate('/send/scanQrCode')
  }, [navigate, setSelectedToken])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      setSelectedToken(undefined)
      navigate({
        pathname: '/send/send',
        params: { to: text, recipientType: 'address' }
      })
    },
    [navigate, setSelectedToken]
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
