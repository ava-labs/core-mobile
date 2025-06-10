import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import { useNewContactAvatar } from 'features/accountSettings/store'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

export const AddContactScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { canGoBack, back, navigate } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const [newContactAvatar, setNewContactAvatar] = useNewContactAvatar()

  const resetNewContactAvatar = useCallback(() => {
    if (newContactAvatar) {
      setNewContactAvatar(undefined)
    }
  }, [newContactAvatar, setNewContactAvatar])

  useEffect(() => {
    resetNewContactAvatar()
  }, [resetNewContactAvatar])

  const [contact, setContact] = useState<Contact>({
    id: contactId,
    name: '',
    type: 'contact',
    avatar: newContactAvatar
  })

  useEffect(() => {
    if (newContactAvatar) {
      setContact(prev => ({ ...prev, avatar: newContactAvatar }))
    }
  }, [newContactAvatar])

  const handleUpdateContact = (updated: Contact): void => {
    setContact(updated)
  }

  const isSaveDisabled = useMemo(() => {
    return (
      (contact.address === undefined &&
        contact.addressXP === undefined &&
        contact.addressBTC === undefined &&
        contact.addressSVM === undefined) ||
      contact.name.length === 0
    )
  }, [contact])

  const handleSave = useCallback(() => {
    dispatch(addContact({ ...contact, id: contactId }))
    setNewContactAvatar(undefined)
    canGoBack() && back()
  }, [back, canGoBack, contact, contactId, dispatch, setNewContactAvatar])

  const handleSelectAvatar = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/addressBook/selectContactAvatar',
      params: {
        name: contact?.name
      }
    })
  }, [navigate, contact?.name])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 16 }}>
        <Button
          type="primary"
          size="large"
          onPress={handleSave}
          disabled={isSaveDisabled}>
          Save
        </Button>
        <Button
          type="tertiary"
          size="large"
          onPress={() => canGoBack() && back()}>
          Cancel
        </Button>
      </View>
    )
  }, [back, canGoBack, handleSave, isSaveDisabled])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      shouldAvoidKeyboard
      disableStickyFooter
      contentContainerStyle={{ padding: 16 }}>
      {contact && (
        <ContactForm
          contact={contact}
          onUpdate={handleUpdateContact}
          onSelectAvatar={handleSelectAvatar}
        />
      )}
    </ScrollScreen>
  )
}
