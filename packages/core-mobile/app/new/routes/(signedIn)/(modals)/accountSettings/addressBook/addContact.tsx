import { Button, useKeyboardHeight, View } from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import { useNewContactAvatar } from 'features/accountSettings/store'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

const AddContactScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { bottom } = useSafeAreaInsets()
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

  return (
    <View sx={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'space-between'
        }}>
        {contact && (
          <ContactForm
            contact={contactWithAvatar}
            onUpdate={handleUpdateContact}
            onSelectAvatar={handleSelectAvatar}
          />
        )}
      </KeyboardAwareScrollView>
      <View
        sx={{
          gap: 16,
          backgroundColor: '$surfacePrimary',
          marginBottom: bottom
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
    </View>
  )
}

export default AddContactScreen
