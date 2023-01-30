import AvaText from 'components/AvaText'
import React, { useCallback, useEffect } from 'react'
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
import { showSimpleToast } from 'components/Snackbar'
import { Contact } from 'Repo'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import RpcRequestBottomSheet from './RpcRequestBottomSheet'

type UpdateContactScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.UpdateContact
>

const UpdateContact = () => {
  const { goBack } = useNavigation<UpdateContactScreenProps['navigation']>()

  const { request, contact } =
    useRoute<UpdateContactScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()

  const theme = useApplicationContext().theme
  const peerMeta = request.payload.peerMeta

  const existingContact = useSelector(selectContact(contact.id))

  useEffect(() => {
    if (!existingContact) {
      showSimpleToast(
        `Ooops, seems the contact you're updating is not in address book.`
      )
      onReject(request)
    }
  }, [existingContact, onReject, request])

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { contact })
    goBack()
  }, [contact, goBack, onApprove, request])

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
    <RpcRequestBottomSheet onClose={rejectAndClose}>
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
              <AvaButton.PrimaryMedium onPress={approveAndClose}>
                Approve
              </AvaButton.PrimaryMedium>
              <Space y={21} />
              <AvaButton.SecondaryMedium onPress={rejectAndClose}>
                Reject
              </AvaButton.SecondaryMedium>
            </View>
          </SafeAreaView>
        </NativeViewGestureHandler>
      )}
    </RpcRequestBottomSheet>
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
