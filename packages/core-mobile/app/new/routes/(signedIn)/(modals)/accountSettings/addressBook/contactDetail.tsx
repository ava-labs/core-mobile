import { Button, ScrollView, showAlert, useTheme } from '@avalabs/k2-alpine'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import React, { useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import {
  Contact,
  editContact,
  removeContact,
  selectContact
} from 'store/addressBook'

const ContactDetailScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const {
    theme: { colors }
  } = useTheme()
  const { bottom } = useSafeAreaInsets()
  const { canGoBack, back } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const contact = useSelector(selectContact(contactId))

  const handleRemoveContact = useCallback(
    (title: string, description: string, buttonText: string) => {
      showAlert({
        title,
        description,
        buttons: [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: buttonText,
            onPress: () => {
              dispatch(removeContact(contactId))
              canGoBack() && back()
            }
          }
        ]
      })
    },
    [back, canGoBack, contactId, dispatch]
  )

  const handleDelete = useCallback(() => {
    handleRemoveContact(
      'Do you want to delete this contact?',
      'This action can’t be undone',
      'Delete'
    )
  }, [handleRemoveContact])

  const handleUpdate = useCallback(
    (updatedContact: Contact) => {
      if (shouldRemoveContact(updatedContact)) {
        handleRemoveContact(
          'Deleting this address will also delete this contact',
          'This action can’t be undone',
          'Confirm'
        )
        return
      }
      dispatch(editContact(updatedContact))
    },
    [dispatch, handleRemoveContact]
  )

  return (
    <KeyboardAvoidingView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flex: 1,
          paddingBottom: 16,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}>
        {contact && <ContactForm contact={contact} onUpdate={handleUpdate} />}
        <Button
          type="secondary"
          size="large"
          onPress={handleDelete}
          style={{ marginBottom: bottom }}
          textStyle={{ color: colors.$textDanger }}>
          Delete
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const shouldRemoveContact = (contact: Contact): boolean => {
  const numOfAddresses = Object.keys(contact).filter(
    key =>
      key.startsWith('address') &&
      (contact as Record<string, unknown>)[key] !== undefined
  )
  return numOfAddresses.length === 0
}

export default ContactDetailScreen
