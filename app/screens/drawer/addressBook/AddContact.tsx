import React, { useCallback, useState } from 'react'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import ContactInput from 'screens/drawer/addressBook/components/ContactInput'
import { v4 as uuidv4 } from 'uuid'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { AddressBookScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { addContact } from 'store/addressBook'
import { useDispatch } from 'react-redux'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'
import { ScrollView } from 'react-native'
import { usePostCapture } from 'hooks/usePosthogCapture'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.Add
>['navigation']

const AddContact = () => {
  const { goBack } = useNavigation<NavigationProp>()
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const { capture } = usePostCapture()
  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [addressBtc, setAddressBtc] = useState('')
  const [error, setError] = useState('')

  const save = useCallback(() => {
    const err = getContactValidationError(title, address, addressBtc)
    if (err) {
      capture('AddContactFailed')
      setError(err)
      return
    }
    const id = uuidv4()
    dispatch(addContact({ id, title, address, addressBtc }))
    capture('AddContactSucceeded')
    goBack()
  }, [address, addressBtc, capture, dispatch, goBack, title])

  return (
    <ScrollView
      contentContainerStyle={{
        minHeight: '100%',
        paddingHorizontal: 16,
        paddingBottom: 16
      }}>
      <AvaText.LargeTitleBold>New Contact</AvaText.LargeTitleBold>
      <Space y={30} />
      <ContactInput
        name={title}
        address={address}
        addressBtc={addressBtc}
        onNameChange={name1 => setTitle(name1)}
        onAddressChange={address1 => setAddress(address1)}
        onAddressBtcChange={address1 => setAddressBtc(address1)}
      />
      <FlexSpacer />
      {!!error && (
        <AvaText.Body2 color={theme.colorError}>{error}</AvaText.Body2>
      )}
      <Space y={16} />
      <AvaButton.PrimaryLarge
        disabled={!title || (!address && !addressBtc)}
        onPress={save}>
        Save
      </AvaButton.PrimaryLarge>
    </ScrollView>
  )
}

export default AddContact
