import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
// import { useApplicationContext } from 'contexts/ApplicationContext'
// import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
// import AddressBookSVG from 'components/svg/AddressBookSVG'
// import AddressBookItem from 'components/addressBook/AddressBookItem'
import { Contact } from '@avalabs/types'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'

type Props = {
  onReject: () => void
  onApprove: () => void
  dappUrl: string
  existingContact: Contact | undefined
  contact: Contact
}

const UpdateContactView = ({
  onReject,
  onApprove,
  dappUrl,
  existingContact
}: // contact
Props): JSX.Element => {
  // const theme = useApplicationContext().theme

  // const renderContacts = (): // contactToUpdate: Contact,
  // // update: Contact
  // JSX.Element => {
  //   return (
  //     <>
  //       {/* <AddressBookItem
  //         title={contactToUpdate.name}
  //         address={contactToUpdate.address}
  //         addressBtc={contactToUpdate.addressBTC}
  //       />
  //       <AddressBookItem
  //         title={update.name}
  //         address={update.address}
  //         addressBtc={update.addressBTC}
  //       /> */}
  //     </>
  //   )
  // }

  return (
    <RpcRequestBottomSheet onClose={onReject}>
      {existingContact && (
        <NativeViewGestureHandler>
          <SafeAreaView style={styles.safeView}>
            <AvaText.LargeTitleBold>Update Contact?</AvaText.LargeTitleBold>
            <Space y={35} />
            <View style={styles.subTitleView}>
              {/* <OvalTagBg
                style={{
                  height: 80,
                  width: 80,
                  backgroundColor: theme.colorBg3
                }}> */}
              {/* <AddressBookSVG size={48} /> */}
              {/* </OvalTagBg> */}
              <Space y={15} />
              <AvaText.Body1 textStyle={styles.subTileText}>
                {new URL(dappUrl).hostname} is requesting to update a contact:
              </AvaText.Body1>
              <Space y={16} />
            </View>
            <Space y={30} />
            {/* {renderContacts(existingContact, contact)} */}
            <FlexSpacer />
            <View style={styles.actionContainer}>
              <AvaButton.PrimaryMedium onPress={onApprove}>
                Approve
              </AvaButton.PrimaryMedium>
              <Space y={21} />
              <AvaButton.SecondaryMedium onPress={onReject}>
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

export default UpdateContactView
