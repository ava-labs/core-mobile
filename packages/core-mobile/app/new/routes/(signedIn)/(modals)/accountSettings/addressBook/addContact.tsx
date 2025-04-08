import { Button, ScrollView, View } from '@avalabs/k2-alpine'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ContactForm } from 'features/accountSettings/components/ContactForm'
import React, { useCallback, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { addContact, Contact } from 'store/addressBook'

const AddContactScreen = (): React.JSX.Element => {
  const dispatch = useDispatch()
  const { bottom } = useSafeAreaInsets()
  const { canGoBack, back } = useRouter()
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const [contact, setContact] = useState<Contact>({ id: contactId })

  const handleUpdateContact = (updated: Contact): void => {
    setContact(prev => {
      return {
        ...prev,
        ...updated
      }
    })
  }

  const isSaveDisabled =
    contact.addressC === undefined &&
    contact.addressAVM === undefined &&
    contact.addressPVM === undefined &&
    contact.addressBTC === undefined &&
    contact.addressEVM === undefined

  const handleSave = useCallback(() => {
    dispatch(addContact({ ...contact, id: contactId }))
    canGoBack() && back()
  }, [back, canGoBack, contact, contactId, dispatch])

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flex: 1,
        paddingBottom: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
      }}>
      {contact && (
        <ContactForm contact={contact} onUpdate={handleUpdateContact} />
      )}
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
    </ScrollView>
  )
}

export default AddContactScreen
