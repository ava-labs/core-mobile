import React, { useCallback, useMemo } from 'react'
import { Keyboard, Platform } from 'react-native'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { Contact } from 'store/addressBook'
import { useContacts } from 'common/hooks/useContacts'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { NetworkVMType } from '@avalabs/vm-module-types'
import { RecentContacts } from '../components/RecentContacts'
import { useSendContext } from '../context/sendContext'
import { getAddressByVmName } from '../utils/getAddressByVmName'

// iOS + RN 0.86: UINavigationController refocuses the search field on Back, which
// jumps the sheet to its keyboard detent. Blur before pushing (react/react-native#55908).
const blurSearchBeforePush = (): void => {
  if (Platform.OS === 'ios') Keyboard.dismiss()
}

export const RecentContactsScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { recentAddresses, contacts, accounts } = useContacts()
  const { resetAmount, setToAddress } = useSendContext()
  const { vmName } = useGlobalSearchParams<{ vmName: NetworkVMType }>()

  const handleSelectContact = useCallback(
    (contact: Contact): void => {
      setToAddress({
        to: contact.id,
        recipientType: contact.type
      })
      resetAmount()
      blurSearchBeforePush()
      navigate({
        pathname: '/send/send'
      })
    },
    [navigate, resetAmount, setToAddress]
  )

  const handleGoToQrCode = useCallback((): void => {
    resetAmount()
    blurSearchBeforePush()
    navigate('/send/scanQrCode')
  }, [navigate, resetAmount])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      setToAddress({
        to: text,
        recipientType: 'address'
      })
      resetAmount()
      blurSearchBeforePush()
      navigate({
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
