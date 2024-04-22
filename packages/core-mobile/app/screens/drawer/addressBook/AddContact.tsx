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
import AnalyticsService from 'services/analytics/AnalyticsService'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.Add
>['navigation']

const AddContact = (): JSX.Element => {
  const { goBack } = useNavigation<NavigationProp>()
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const [title, setTitle] = useState('')
  const [cChainAddress, setCChainAddress] = useState('')
  const [pChainAddress, setPChainAddress] = useState('')
  const [addressBtc, setAddressBtc] = useState('')
  const [error, setError] = useState('')

  const save = useCallback(() => {
    const err = getContactValidationError({
      name: title,
      cChainAddress,
      pChainAddress,
      btcAddress: addressBtc
    })
    if (err) {
      AnalyticsService.capture('AddContactFailed')
      setError(err)
      return
    }
    const id = uuidv4()
    dispatch(
      addContact({
        id,
        title,
        address: cChainAddress,
        addressBtc,
        addressPVM: pChainAddress
      })
    )
    AnalyticsService.capture('AddContactSucceeded')
    goBack()
  }, [title, cChainAddress, pChainAddress, addressBtc, dispatch, goBack])

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
        address={cChainAddress}
        addressBtc={addressBtc}
        addressPvm={pChainAddress}
        onNameChange={name1 => setTitle(name1)}
        onAddressChange={address1 => setCChainAddress(address1)}
        onAddressBtcChange={address1 => setAddressBtc(address1)}
        onAddressPvmChange={address1 => setPChainAddress(address1)}
      />
      <FlexSpacer />
      {!!error && (
        <AvaText.Body2 color={theme.colorError}>{error}</AvaText.Body2>
      )}
      <Space y={16} />
      <AvaButton.PrimaryLarge
        disabled={!title || (!cChainAddress && !addressBtc && !pChainAddress)}
        onPress={save}>
        Save
      </AvaButton.PrimaryLarge>
    </ScrollView>
  )
}

export default AddContact
