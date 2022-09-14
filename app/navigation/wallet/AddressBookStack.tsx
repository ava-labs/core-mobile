import AppNavigation from 'navigation/AppNavigation'
import {
  createStackNavigator,
  StackNavigationOptions
} from '@react-navigation/stack'
import React, { useCallback, useEffect } from 'react'
import AddressBook from 'screens/drawer/addressBook/AddressBook'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { useNavigation, useRoute } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import AddSVG from 'components/svg/AddSVG'
import AddContact from 'screens/drawer/addressBook/AddContact'
import ContactDetails from 'screens/drawer/addressBook/ContactDetails'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Contact } from 'Repo'
import { useDispatch, useSelector } from 'react-redux'
import {
  removeContact,
  saveEditingContact,
  selectContact,
  selectEditingContact,
  setEditingContact
} from 'store/addressBook'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'
import { AddressBookScreenProps } from '../types'

export type AddressBookStackParamList = {
  [AppNavigation.AddressBook.List]: undefined
  [AppNavigation.AddressBook.Add]: undefined
  [AppNavigation.AddressBook.Details]: {
    contactId: string
    editable: boolean
    isContactValid?: boolean
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
  const dispatch = useDispatch()
  const { setParams, setOptions, goBack } =
    useNavigation<ContactDetailsScreenProps['navigation']>()

  const { params } = useRoute<ContactDetailsScreenProps['route']>()
  const editable = params?.editable ?? false
  const isContactValid = params?.isContactValid ?? false
  const contact = useSelector(selectContact(params.contactId))
  const editingContact = useSelector(selectEditingContact)

  useEffect(() => {
    const err = getContactValidationError(
      editingContact?.title,
      editingContact?.address,
      editingContact?.addressBtc
    )
    setParams({ editable, isContactValid: err === undefined })
  }, [
    editable,
    editingContact?.address,
    editingContact?.addressBtc,
    editingContact?.title,
    setParams
  ])

  useEffect(() => {
    setParams({ editable: false, isContactValid })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <EditAddressBookContact onEdit={onEdit} />
      ) as Partial<StackNavigationOptions>)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    dispatch(
      setEditingContact(contact ? Object.assign({}, contact) : undefined)
    )

    return () => {
      dispatch(setEditingContact(undefined))
    }
  }, [contact, dispatch])

  function saveContact() {
    dispatch(saveEditingContact())
    setParams({ editable: false, isContactValid })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <EditAddressBookContact onEdit={onEdit} />
      ) as Partial<StackNavigationOptions>)
    })
  }

  function onEdit() {
    setParams({ editable: true, isContactValid })
    setOptions({
      ...(MainHeaderOptions(
        '',
        false,
        <SaveAddressBookContact onSave={saveContact} />
      ) as Partial<StackNavigationOptions>)
    })
  }

  const deleteContact = useCallback(
    (c: Contact) => {
      dispatch(removeContact(c.id))
      goBack()
    },
    [dispatch, goBack]
  )

  const onChange = useCallback(
    (c: Contact) => {
      dispatch(setEditingContact(c))
    },
    [dispatch]
  )

  return (
    <ContactDetails
      editable={editable}
      contact={
        editingContact ??
        ({ id: '', title: '', address: '', addressBtc: '' } as Contact)
      }
      onChange={onChange}
      onDelete={deleteContact}
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
  const { params } = useRoute<ContactDetailsScreenProps['route']>()
  const isContactValid = params?.isContactValid

  return (
    <AvaButton.Icon disabled={!isContactValid} onPress={() => onSave()}>
      <AvaText.ButtonLarge
        textStyle={{
          color: isContactValid ? theme.colorPrimary1 : theme.colorDisabled
        }}>
        Save
      </AvaText.ButtonLarge>
    </AvaButton.Icon>
  )
}

export default AddressBookStack
