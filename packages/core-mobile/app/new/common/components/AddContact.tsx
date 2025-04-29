import { noop } from '@avalabs/core-utils-sdk'
import { Button, View } from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import React, { useCallback, useState, useMemo } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

export const AddContact = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { bottom } = useSafeAreaInsets()
  const { canGoBack, back } = useRouter()
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

  return (
    <View sx={{ flex: 1, paddingHorizontal: 16, paddingBottom: 16 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'space-between'
        }}>
        {contact && (
          <ContactForm
            contact={contact}
            onUpdate={handleUpdateContact}
            // TODO: implement onSelectAvatar
            onSelectAvatar={noop}
          />
        )}
      </ScrollView>
      <View sx={{ gap: 16, backgroundColor: '$surfacePrimary' }}>
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
    </View>
  )
}
