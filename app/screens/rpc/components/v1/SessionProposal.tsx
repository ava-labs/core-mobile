import AvaText from 'components/AvaText'
import React, { useCallback, useEffect } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import AccountItem from 'screens/portfolio/account/AccountItem'
import { showSimpleToast } from 'components/Snackbar'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import RpcRequestBottomSheet from '../shared/RpcRequestBottomSheet'

const showNoActiveAccountMessage = () => {
  showSimpleToast('There is no active account.')
}

type SessionProposalScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SessionProposal
>

const SessionProposal = () => {
  const { goBack } = useNavigation<SessionProposalScreenProps['navigation']>()
  const { request } = useRoute<SessionProposalScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

  const theme = useApplicationContext().theme
  const activeAccount = useSelector(selectActiveAccount)
  const peerMeta = request.payload.peerMeta
  const siteName = peerMeta?.name ?? ''

  useEffect(() => {
    if (!activeAccount) {
      showNoActiveAccountMessage()
      onReject(request)
    }
  }, [activeAccount, request, onReject])

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request)
    goBack()
  }, [goBack, onApprove, request])

  return (
    <RpcRequestBottomSheet onClose={rejectAndClose}>
      <NativeViewGestureHandler>
        <ScrollView contentContainerStyle={styles.container}>
          <AvaText.LargeTitleBold>Connect to site?</AvaText.LargeTitleBold>
          <Space y={30} />
          <View style={styles.iconContainer}>
            <OvalTagBg
              style={{
                height: 80,
                width: 80,
                backgroundColor: theme.colorBg3
              }}>
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
              onPress={approveAndClose}
              testID="session_proposal__approve">
              Approve
            </AvaButton.PrimaryMedium>
            <Space y={21} />
            <AvaButton.SecondaryMedium
              onPress={rejectAndClose}
              testID="session_proposal__reject">
              Reject
            </AvaButton.SecondaryMedium>
          </View>
        </ScrollView>
      </NativeViewGestureHandler>
    </RpcRequestBottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    minHeight: '100%',
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

export default SessionProposal
