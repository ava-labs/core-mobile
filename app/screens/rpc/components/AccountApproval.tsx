import AvaText from 'components/AvaText'
import React, { FC, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import AccountItem from 'screens/portfolio/account/AccountItem'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { SessionRequestRpcRequest } from 'store/rpc/handlers/session_request'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'

interface Props {
  dappEvent: SessionRequestRpcRequest
  onReject: (request: SessionRequestRpcRequest, message?: string) => void
  onApprove: (request: SessionRequestRpcRequest) => void
  onClose: (request: SessionRequestRpcRequest) => void
}

const showSuccessMessage = (siteName: string) => {
  showSnackBarCustom({
    component: <GeneralToast message={`Connected to ${siteName}`} />,
    duration: 'short'
  })
}

const showNoActiveAccountMessage = () => {
  showSnackBarCustom({
    component: <GeneralToast message={`There is no active account.`} />,
    duration: 'short'
  })
}

const AccountApproval: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const activeAccount = useActiveAccount()
  const peerMeta = dappEvent.payload.peerMeta
  const siteName = peerMeta?.name ?? ''

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      onReject(dappEvent)
      onClose(dappEvent)
    }
  }, [activeAccount, dappEvent, onClose, onReject])

  return (
    <NativeViewGestureHandler>
      <SafeAreaView style={styles.container}>
        <AvaText.LargeTitleBold>Connect to site?</AvaText.LargeTitleBold>
        <Space y={30} />
        <View style={styles.iconContainer}>
          <OvalTagBg
            style={{ height: 80, width: 80, backgroundColor: theme.colorBg3 }}>
            <Avatar.Custom
              name={'dapp'}
              logoUri={peerMeta?.icons[0]}
              size={48}
            />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
              {siteName}
            </AvaText.Heading2>
            <Space y={6} />
            <AvaText.Body3 color={theme.colorText1}>
              {peerMeta?.url}
            </AvaText.Body3>
          </View>
          <Space y={16} />
        </View>
        <Space y={16} />
        {activeAccount && (
          <View style={styles.accountWrapper}>
            <AccountItem account={activeAccount} selected />
          </View>
        )}
        <FlexSpacer />
        <AvaText.Body2 textStyle={{ textAlign: 'center' }}>
          Only connect to sites that you trust
        </AvaText.Body2>
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium
            onPress={() => {
              showSuccessMessage(siteName)
              onApprove(dappEvent)
            }}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    flex: 1,
    paddingHorizontal: 16
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  accountWrapper: {
    borderRadius: 6,
    overflow: 'hidden'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12
  }
})

export default AccountApproval
