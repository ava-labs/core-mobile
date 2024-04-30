import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useCallback, useMemo } from 'react'
import AvaText from 'components/AvaText'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import BlockchainCircle from 'components/BlockchainCircle'
import ContactInput from 'screens/drawer/addressBook/components/ContactInput'
import FlexSpacer from 'components/FlexSpacer'
import { Space } from 'components/Space'
import TokenAddress from 'components/TokenAddress'
import TextFieldBg from 'components/styling/TextFieldBg'
import { titleToInitials } from 'utils/Utils'
import { Row } from 'components/Row'
import ShareSVG from 'components/svg/ShareSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { shareContact } from 'screens/drawer/addressBook/utils'
import { Contact } from '@avalabs/types'

const ContactDetails = ({
  contact,
  onChange,
  onDelete,
  onShareDialog,
  editable = false
}: {
  contact: Contact
  onChange: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onShareDialog: (contact: Contact) => void
  editable?: boolean
}): JSX.Element => {
  const theme = useApplicationContext().theme
  const addresses = useMemo(() => {
    const list = []
    contact.address && list.push(contact.address)
    contact.addressBTC && list.push(contact.addressBTC)
    contact.addressXP && list.push(contact.addressXP)
    return list
  }, [contact.address, contact.addressBTC, contact.addressXP])

  const handleNameChange = useCallback(
    (name: string) => {
      onChange({
        ...contact,
        name
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

  const handleXPAddressChange = useCallback(
    (addressXP: string) => {
      onChange({
        ...contact,
        addressXP
      })
    },
    [contact, onChange]
  )

  const handleBtcAddressChange = useCallback(
    (addressBTC: string) => {
      onChange({
        ...contact,
        addressBTC
      })
    },
    [contact, onChange]
  )

  const handleShare = useCallback(() => {
    if (addresses.length === 1) {
      shareContact({
        name: contact.name,
        cChainAddress: contact.address,
        xpChainAddress: contact.addressXP,
        btcAddress: contact.addressBTC
      })
    } else {
      onShareDialog(contact)
    }
  }, [addresses.length, contact, onShareDialog])

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        <View style={{ alignItems: 'center' }}>
          <BlockchainCircle
            size={80}
            textSize={32}
            chain={titleToInitials(contact.name)}
          />
          <Space y={24} />
          <AvaText.Heading2>{contact.name}</AvaText.Heading2>
        </View>
        <Space y={40} />
        {editable ? (
          <>
            <ContactInput
              name={contact.name}
              address={contact.address}
              addressBtc={contact.addressBTC ?? ''}
              addressXP={contact.addressXP ?? ''}
              onNameChange={handleNameChange}
              onAddressChange={handleAddressChange}
              onAddressBtcChange={handleBtcAddressChange}
              onAddressXPChange={handleXPAddressChange}
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
            {!!contact.address && !!contact.addressBTC && <Space y={40} />}
            {!!contact.addressBTC && (
              <AddressView title={'Address BTC'} address={contact.addressBTC} />
            )}
            {(!!contact.address || !!contact.addressBTC) &&
              !!contact.addressXP && <Space y={40} />}
            {!!contact.addressXP && (
              <AddressView
                title={'Address X/P-Chain'}
                address={contact.addressXP}
              />
            )}
            <Space y={34} />
            <Row style={{ alignItems: 'center' }}>
              <AvaButton.TextLarge
                style={{ alignSelf: 'flex-start' }}
                onPress={handleShare}>
                Share this Contact
              </AvaButton.TextLarge>
              <ShareSVG color={theme.colorPrimary1} />
            </Row>
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
}): JSX.Element => {
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
