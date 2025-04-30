import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import React, { useCallback, useMemo, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

export const AddContactScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { bottom } = useSafeAreaInsets()
  const { canGoBack, back, navigate } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const [contact, setContact] = useState<Contact>({
    id: contactId,
    name: '',
    type: 'contact'
  })

  const handleUpdateContact = (updated: Contact): void => {
    setContact(updated)
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
          onPress={() => canGoBack() && back()}
          style={{ marginBottom: bottom }}>
          Cancel
        </Button>
      </View>
    )
  }, [back, bottom, canGoBack, handleSave, isSaveDisabled])

  return (
    <ScrollScreen
      renderFooter={renderFooter}
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
