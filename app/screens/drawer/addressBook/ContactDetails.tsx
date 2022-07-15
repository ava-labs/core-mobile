import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import AvaText from 'components/AvaText'
import { StyleSheet, View } from 'react-native'
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
  const [title, setTitle] = useState(contact.title)
  const [address, setAddress] = useState(contact.address)
  const [addressBtc, setAddressBtc] = useState(contact.addressBtc)

  useEffect(() => {
    onChange({ id: contact.id, address, addressBtc, title })
  }, [address, addressBtc, contact.id, onChange, title])

  return (
    <SafeAreaProvider style={{ flex: 1, padding: 16 }}>
      <View style={{ alignItems: 'center' }}>
        <BlockchainCircle
          size={80}
          textSize={32}
          chain={titleToInitials(title)}
        />
        <Space y={24} />
        <AvaText.Heading2>{title}</AvaText.Heading2>
      </View>
      <Space y={40} />
      {editable ? (
        <>
          <ContactInput
            name={title}
            address={address}
            addressBtc={addressBtc}
            onNameChange={setTitle}
            onAddressChange={setAddress}
            onAddressBtcChange={setAddressBtc}
          />
          <FlexSpacer />
          <AvaButton.TextLarge onPress={() => onDelete(contact)}>
            Delete Contact
          </AvaButton.TextLarge>
        </>
      ) : (
        <>
          {!!address && <AddressView title={'Address'} address={address} />}
          {!!address && !!addressBtc && <Space y={40} />}
          {!!addressBtc && (
            <AddressView title={'Address BTC'} address={addressBtc} />
          )}
        </>
      )}
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
