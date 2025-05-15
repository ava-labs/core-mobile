import React, { useCallback, useMemo } from 'react'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { RecentContacts } from '../components/RecentContacts'
import { useSendContext } from '../context/sendContext'
import { getAddressByVmName } from '../utils/getAddressByVmName'

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { recentAddresses, contacts, accounts } = useContacts()
  const { resetAmount, setToAddress } = useSendContext()
  const { vmName } = useGlobalSearchParams<{ vmName: NetworkVMType }>()

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
      vmName
        ? recentAddresses.filter(
            address =>
              getAddressByVmName({
                contact: address,
                vmName,
                isDeveloperMode
              }) !== undefined
          )
        : recentAddresses,
    [vmName, recentAddresses, isDeveloperMode]
  )

  const contactsBySelectedToken = useMemo(
    () =>
      vmName
        ? [...contacts, ...accounts].filter(
            contact =>
              getAddressByVmName({
                contact,
                vmName,
                isDeveloperMode
              }) !== undefined
          )
        : [...contacts, ...accounts],
    [contacts, accounts, vmName, isDeveloperMode]
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
