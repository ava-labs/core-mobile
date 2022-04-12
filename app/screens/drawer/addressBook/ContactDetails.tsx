import {SafeAreaProvider} from 'react-native-safe-area-context'
import React, {useMemo} from 'react'
import {useApplicationContext} from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import {StyleSheet, View} from 'react-native'
import AvaButton from 'components/AvaButton'
import {RouteProp, useRoute} from '@react-navigation/native'
import {AddressBookStackParamList} from 'navigation/wallet/AddressBookStack'
import BlockchainCircle from 'components/BlockchainCircle'
import useAddressBook from 'screens/drawer/addressBook/useAddressBook'
import ContactInput from 'screens/drawer/addressBook/components/ContactInput'
import FlexSpacer from 'components/FlexSpacer'
import {Space} from 'components/Space'
import {Contact} from 'Repo'
import TokenAddress from 'components/TokenAddress'

const ContactDetails = ({
  contact,
  onSend,
  onDelete
}: {
  contact: Contact
  onSend: (contact: Contact) => void
  onDelete: (contact: Contact) => void
}) => {
  const {titleToInitials} = useAddressBook()
  const {params} = useRoute<RouteProp<AddressBookStackParamList>>()

  const editable = useMemo(() => {
    return params?.editable ?? false
  }, [params?.editable])

  return (
    <SafeAreaProvider style={{flex: 1, padding: 16}}>
      <View style={{alignItems: 'center'}}>
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
            initName={contact.title}
            initAddress={contact.address}
            onNameChange={name1 => (contact.title = name1)}
            onAddressChange={address1 => (contact.address = address1)}
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

const AddressView = ({contact}: {contact: Contact}) => {
  const {theme} = useApplicationContext()
  return (
    <>
      <AvaText.Body1>Address</AvaText.Body1>
      <Space y={8} />
      <View
        style={[
          styles.copyAddressContainer,
          {backgroundColor: theme.colorBg2}
        ]}>
        <TokenAddress
          address={contact.address}
          showFullAddress
          textType={'ButtonMedium'}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  copyAddressContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8
  }
})

export default ContactDetails
