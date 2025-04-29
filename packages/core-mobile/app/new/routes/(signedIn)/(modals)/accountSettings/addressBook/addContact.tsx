import { Button, View } from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import { useNewContactAvatar } from 'features/accountSettings/store'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

const AddContactScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { canGoBack, back, navigate } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const [newContactAvatar, setNewContactAvatar] = useNewContactAvatar()

  useEffect(() => {
    return () => {
      setNewContactAvatar(undefined)
    }
  }, [setNewContactAvatar])

  const [contact, setContact] = useState<Contact>({
    id: contactId,
    name: ''
  })

  const contactWithAvatar = useMemo(() => {
    return { ...contact, avatar: newContactAvatar }
  }, [contact, newContactAvatar])

  const handleUpdateContact = (updated: Contact): void => {
    setContact({ ...updated, avatar: newContactAvatar })
  }

  const isSaveDisabled = useMemo(() => {
    return (
      (contact.address === undefined &&
        contact.addressXP === undefined &&
        contact.addressBTC === undefined) ||
      contact.name.length === 0
    )
  }, [contact])

  const handleSave = useCallback(() => {
    dispatch(addContact({ ...contact, id: contactId }))
    canGoBack() && back()
  }, [back, canGoBack, contact, contactId, dispatch])

  const handleSelectAvatar = useCallback(() => {
    navigate({
      pathname: '/accountSettings/addressBook/selectContactAvatar',
      params: {
        name: contact?.name
      }
    })
  }, [navigate, contact?.name])

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 16
        }}>
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
    <ScrollViewScreenTemplate
      isModal
      renderFooter={renderFooter}
      disabled
      navigationTitle="Add contact"
      contentContainerStyle={{
        padding: 16
      }}>
      {contact && (
        <ContactForm
          contact={contactWithAvatar}
          onUpdate={handleUpdateContact}
          onSelectAvatar={handleSelectAvatar}
        />
      )}
    </ScrollViewScreenTemplate>
  )
}

export default AddContactScreen
