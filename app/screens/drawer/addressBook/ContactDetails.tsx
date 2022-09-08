import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useCallback } from 'react'
import AvaText from 'components/AvaText'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import BlockchainCircle from 'components/BlockchainCircle'
import ContactInput from 'screens/drawer/addressBook/components/ContactInput'
import FlexSpacer from 'components/FlexSpacer'
import { Space } from 'components/Space'
import { Contact } from 'Repo'
import TokenAddress from 'components/TokenAddress'
import TextFieldBg from 'components/styling/TextFieldBg'
import { titleToInitials } from 'utils/Utils'

const ContactDetails = ({
  contact,
  onChange,
  onDelete,
  editable = false
}: {
  contact: Contact
  onChange: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  editable?: boolean
}) => {
  const handleNameChange = useCallback(
    (name: string) => {
      onChange({
        ...contact,
        title: name
      })
    },
    [contact, onChange]
  )

  const handleAddressChange = useCallback(
    (address: string) => {
      onChange({
        ...contact,
        address
      })
    },
    [contact, onChange]
  )

  const handleBtcAddressChange = useCallback(
    (addressBtc: string) => {
      onChange({
        ...contact,
        addressBtc
      })
    },
    [contact, onChange]
  )

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
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
              onNameChange={handleNameChange}
              onAddressChange={handleAddressChange}
              onAddressBtcChange={handleBtcAddressChange}
            />
            <FlexSpacer />
            <AvaButton.TextLarge onPress={() => onDelete(contact)}>
              Delete Contact
            </AvaButton.TextLarge>
          </>
        ) : (
          <>
            {!!contact.address && (
              <AddressView title={'Address'} address={contact.address} />
            )}
            {!!contact.address && !!contact.addressBtc && <Space y={40} />}
            {!!contact.addressBtc && (
              <AddressView title={'Address BTC'} address={contact.addressBtc} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaProvider>
  )
}

const AddressView = ({
  title,
  address
}: {
  title: string
  address: string
}) => {
  return (
    <>
      <AvaText.Body1>{title}</AvaText.Body1>
      <Space y={8} />

      <TextFieldBg style={styles.copyAddressContainer}>
        <TokenAddress
          address={address}
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
