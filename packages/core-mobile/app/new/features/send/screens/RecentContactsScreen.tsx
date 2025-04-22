import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { useSendSelectedToken } from '../store'
import { RecentContacts } from '../components/RecentContacts'
import { useSendContext } from '../context/sendContext'

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { recentAddresses, contacts, accounts } = useContacts()
  const [_, setSelectedToken] = useSendSelectedToken()
  const { resetAmount } = useSendContext()

  const handleSelectContact = useCallback(
    (contact: Contact): void => {
      setSelectedToken(undefined)
      resetAmount()
      navigate({
        pathname: '/send/send',
        params: { to: contact.id, recipientType: 'contact' }
      })
    },
    [navigate, resetAmount, setSelectedToken]
  )

  const handleGoToQrCode = useCallback((): void => {
    setSelectedToken(undefined)
    resetAmount()
    navigate('/send/scanQrCode')
  }, [navigate, resetAmount, setSelectedToken])

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
