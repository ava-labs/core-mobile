import { SafeAreaProvider } from 'react-native-safe-area-context'
import React from 'react'
import AvaText from 'components/AvaText'
import { StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import BlockchainCircle from 'components/BlockchainCircle'
import useAddressBook from 'screens/drawer/addressBook/useAddressBook'
import ContactInput from 'screens/drawer/addressBook/components/ContactInput'
import FlexSpacer from 'components/FlexSpacer'
import { Space } from 'components/Space'
import { Contact } from 'Repo'
import TokenAddress from 'components/TokenAddress'
import TextFieldBg from 'components/styling/TextFieldBg'

const ContactDetails = ({
  contact,
  onSend,
  onDelete,
  editable = false
}: {
  contact: Contact
  onSend: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  editable?: boolean
}) => {
  const { titleToInitials } = useAddressBook()

  return (
    <SafeAreaProvider style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <BlockchainCircle
          size={80}
          textSize={32}
          chain={titleToInitials(contact.title)}
        />
        <Space y={24} />
        <AvaText.Heading2>{contact.title}</AvaText.Heading2>
      </View>
      <Space y={40} />
      {editable ? (
        <>
          <ContactInput
            name={contact.title}
            address={contact.address}
            addressBtc={contact.addressBtc}
            onNameChange={name1 => (contact.title = name1)}
            onAddressChange={address1 => (contact.address = address1)}
            onAddressBtcChange={address1 => (contact.addressBtc = address1)}
          />
          <FlexSpacer />
          <AvaButton.TextLarge onPress={() => onDelete(contact)}>
            Delete Contact
          </AvaButton.TextLarge>
        </>
      ) : (
        <>
          <AddressView contact={contact} />
          <FlexSpacer />
          <AvaButton.PrimaryLarge onPress={() => onSend(contact)}>
            Send
          </AvaButton.PrimaryLarge>
        </>
      )}
    </SafeAreaProvider>
  )
}

const AddressView = ({ contact }: { contact: Contact }) => {
  return (
    <>
      <AvaText.Body1>Address</AvaText.Body1>
      <Space y={8} />

      <TextFieldBg style={styles.copyAddressContainer}>
        <TokenAddress
          address={contact.address}
          showFullAddress
          textType={'ButtonMedium'}
        />
      </TextFieldBg>
    </>
  )
}

const styles = StyleSheet.create({
  copyAddressContainer: {
    alignItems: 'center'
  }
})

export default ContactDetails
