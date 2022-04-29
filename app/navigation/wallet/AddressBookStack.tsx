import AppNavigation from 'navigation/AppNavigation'
import {
  createStackNavigator,
  StackNavigationOptions
} from '@react-navigation/stack'
import React, { useCallback, useEffect, useMemo } from 'react'
import AddressBook from 'screens/drawer/addressBook/AddressBook'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useNavigation, useRoute } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import AddSVG from 'components/svg/AddSVG'
import AddContact from 'screens/drawer/addressBook/AddContact'
import ContactDetails from 'screens/drawer/addressBook/ContactDetails'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import useAddressBook from 'screens/drawer/addressBook/useAddressBook'
import { Contact } from 'Repo'
import { AddressBookScreenProps } from '../types'

export type AddressBookStackParamList = {
  [AppNavigation.AddressBook.List]: undefined
  [AppNavigation.AddressBook.Add]: undefined
  [AppNavigation.AddressBook.Details]: {
    contactId: string
    editable: boolean
  }
}
const Stack = createStackNavigator<AddressBookStackParamList>()

const AddressBookStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <Stack.Screen
        options={{
          headerShown: true,
          ...(MainHeaderOptions(
            'Address Book',
            false,
            <AddAddressBookContact />
          ) as Partial<StackNavigationOptions>)
        }}
        name={AppNavigation.AddressBook.List}
        component={AddressBook}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          ...(MainHeaderOptions('') as Partial<StackNavigationOptions>)
        }}
        name={AppNavigation.AddressBook.Add}
        component={AddContact}
      />
      <Stack.Screen
        options={{
          headerShown: true
        }}
        name={AppNavigation.AddressBook.Details}
        component={ContactDetailsComp}
      />
    </Stack.Navigator>
  )
}

type ContactDetailsScreenProps = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.Details
>

const ContactDetailsComp = () => {
  const { setParams, setOptions, navigate, goBack } =
    useNavigation<ContactDetailsScreenProps['navigation']>()

  const { onDelete, onSave } = useAddressBook()
  const { params } = useRoute<ContactDetailsScreenProps['route']>()
  const { addressBook } = useApplicationContext().repo.addressBookRepo

  const clonedContact = useMemo(
    () =>
      (params?.contactId &&
        Object.assign({}, addressBook.get(params.contactId))) ||
      ({ id: '', title: '', address: '' } as Contact),
    [addressBook, params?.contactId]
  )

  const editable = params?.editable ?? false

  const saveContact = useCallback(() => {
    onSave(clonedContact)
    setParams({ editable: false })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <EditAddressBookContact onEdit={onEdit} />
      ) as Partial<StackNavigationOptions>)
    })
  }, [])

  const onEdit = useCallback(() => {
    setParams({ editable: true })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <SaveAddressBookContact onSave={saveContact} />
      ) as Partial<StackNavigationOptions>)
    })
  }, [])

  const deleteContact = useCallback((contact: Contact) => {
    onDelete(contact)
    goBack()
  }, [])

  useEffect(() => {
    setParams({ editable: false })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <EditAddressBookContact onEdit={onEdit} />
      ) as Partial<StackNavigationOptions>)
    })
  }, [])

  return (
    <ContactDetails
      editable={editable}
      contact={clonedContact}
      onDelete={contact => deleteContact(contact)}
      onSend={contact => {
        navigate(AppNavigation.Wallet.SendTokens, {
          screen: AppNavigation.Send.Send,
          params: { contact }
        })
      }}
    />
  )
}

type AddContactNavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.List
>['navigation']

const AddAddressBookContact = () => {
  const { navigate } = useNavigation<AddContactNavigationProp>()
  return (
    <AvaButton.Icon onPress={() => navigate(AppNavigation.AddressBook.Add)}>
      <AddSVG hideCircle />
    </AvaButton.Icon>
  )
}

const EditAddressBookContact = ({ onEdit }: { onEdit: () => void }) => {
  const { theme } = useApplicationContext()

  return (
    <AvaButton.Icon onPress={() => onEdit()}>
      <AvaText.ButtonLarge textStyle={{ color: theme.colorPrimary1 }}>
        Edit
      </AvaText.ButtonLarge>
    </AvaButton.Icon>
  )
}

const SaveAddressBookContact = ({ onSave }: { onSave: () => void }) => {
  const { theme } = useApplicationContext()

  return (
    <AvaButton.Icon onPress={() => onSave()}>
      <AvaText.ButtonLarge textStyle={{ color: theme.colorPrimary1 }}>
        Save
      </AvaText.ButtonLarge>
    </AvaButton.Icon>
  )
}

export default AddressBookStack
