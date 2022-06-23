import { SafeAreaProvider } from 'react-native-safe-area-context'
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
import { isAddress } from '@ethersproject/address'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { addContact } from 'store/addressBook'
import { useDispatch } from 'react-redux'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.Add
>['navigation']

const AddContact = () => {
  const { goBack } = useNavigation<NavigationProp>()
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()

  const [title, setTitle] = useState('')
  const [address, setAddress] = useState('')
  const [addressBtc, setAddressBtc] = useState('')
  const [error, setError] = useState('')

  const save = useCallback(() => {
    if (!address && !addressBtc) {
      setError('Address required')
      return
    }
    if (address && !isAddress(address)) {
      setError('Not valid EVM address')
      return
    }
    if (addressBtc && !isBech32Address(addressBtc)) {
      setError('invalid BTC address')
      return
    }
    const id = uuidv4()
    dispatch(addContact({ id, title, address, addressBtc }))
    goBack()
  }, [address, addressBtc, dispatch, goBack, title])

  return (
    <SafeAreaProvider
      style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
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
    </SafeAreaProvider>
  )
}

export default AddContact
