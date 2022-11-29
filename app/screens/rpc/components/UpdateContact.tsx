import AvaText from 'components/AvaText'
import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { useSelector } from 'react-redux'
import AddressBookSVG from 'components/svg/AddressBookSVG'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { selectContact } from 'store/addressBook'
import { Contact as SharedContact } from '@avalabs/types'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { Contact } from 'Repo'
import { AvalancheUpdateContactRequest } from 'store/rpc/handlers/avalanche_updateContact'

interface Props {
  dappEvent: AvalancheUpdateContactRequest
  onReject: (request: AvalancheUpdateContactRequest, message?: string) => void
  onApprove: (request: AvalancheUpdateContactRequest) => void
  onClose: (request: AvalancheUpdateContactRequest) => void
}

const UpdateContact: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const contact = dappEvent.contact
  const peerMeta = dappEvent.payload.peerMeta

  const existingContact = useSelector(selectContact(contact.id))

  if (!existingContact) {
    showSnackBarCustom({
      component: (
        <GeneralToast
          message={`Ooops, seems the contact you're updating is not in address book.`}
        />
      ),
      duration: 'short'
    })
    onReject(dappEvent)
    onClose(dappEvent)
  }

  const renderContacts = (contactToUpdate: Contact, update: SharedContact) => {
    return (
      <>
        <AddressBookItem
          title={contactToUpdate.title}
          address={contactToUpdate.address}
          addressBtc={contactToUpdate.addressBtc}
        />
        <AddressBookItem
          title={update.name}
          address={update.address}
          addressBtc={update.addressBTC}
        />
      </>
    )
  }

  return (
    <>
      {existingContact && (
        <NativeViewGestureHandler>
          <SafeAreaView style={styles.safeView}>
            <AvaText.LargeTitleBold>Update Contact?</AvaText.LargeTitleBold>
            <Space y={35} />
            <View style={styles.subTitleView}>
              <OvalTagBg
                style={{
                  height: 80,
                  width: 80,
                  backgroundColor: theme.colorBg3
                }}>
                <AddressBookSVG size={48} />
              </OvalTagBg>
              <Space y={15} />
              <AvaText.Body1 textStyle={styles.subTileText}>
                {new URL(peerMeta?.url ?? '').hostname} is requesting to update
                a contact:
              </AvaText.Body1>
              <Space y={16} />
            </View>
            <Space y={30} />
            {renderContacts(existingContact, contact)}
            <FlexSpacer />
            <View style={styles.actionContainer}>
              <AvaButton.PrimaryMedium onPress={() => onApprove(dappEvent)}>
                Approve
              </AvaButton.PrimaryMedium>
              <Space y={21} />
              <AvaButton.SecondaryMedium
                onPress={() => {
                  onReject(dappEvent)
                  onClose(dappEvent)
                }}>
                Reject
              </AvaButton.SecondaryMedium>
            </View>
          </SafeAreaView>
        </NativeViewGestureHandler>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  safeView: {
    paddingTop: 32,
    flex: 1,
    paddingHorizontal: 16
  },
  subTitleView: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  subTileText: {
    textAlign: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  }
})

export default UpdateContact
