import { Button, showAlert, useTheme } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import React, { useCallback } from 'react'
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
  const { canGoBack, back, navigate } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const contact = useSelector(selectContact(contactId))

  const handleRemoveContact = useCallback(
    (title: string, description: string, buttonText: string) => {
      showAlert({
        title,
        description,
        buttons: [
          {
            text: 'Cancel'
          },
          {
            text: buttonText,
            style: 'destructive',
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

  const handleSelectAvatar = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/addressBook/editContactAvatar',
      params: { contactId }
    })
  }, [navigate, contactId])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="secondary"
        size="large"
        onPress={handleDelete}
        textStyle={{ color: colors.$textDanger }}>
        Delete
      </Button>
    )
  }, [handleDelete, colors.$textDanger])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {contact && (
        <ContactForm
          onSelectAvatar={handleSelectAvatar}
          contact={contact}
          onUpdate={handleUpdate}
        />
      )}
    </ScrollScreen>
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
