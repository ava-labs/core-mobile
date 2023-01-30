import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import EthSign from 'screens/rpc/components/SignMessage/EthSign'
import PersonalSign from 'screens/rpc/components/SignMessage/PersonalSign'
import SignDataV4 from 'screens/rpc/components/SignMessage/SignDataV4'
import { ScrollView } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { RpcMethod, selectRequestStatus } from 'store/walletConnect'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import { useDappConnectionContext } from 'contexts/DappConnectionContext'
import RpcRequestBottomSheet from 'screens/rpc/components/RpcRequestBottomSheet'
import { MessageAction } from './types'

type SignMessageScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SignMessage
>

const SignMessage = () => {
  const { goBack } = useNavigation<SignMessageScreenProps['navigation']>()

  const { request, data } = useRoute<SignMessageScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionContext()

  const requestStatus = useSelector(selectRequestStatus(request.payload.id))

  const theme = useApplicationContext().theme

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { data })
    goBack()
  }, [data, goBack, onApprove, request])

  useEffect(() => {
    if (!requestStatus) return

    if (requestStatus.error) {
      showSnackBarCustom({
        component: (
          <TransactionToast
            type={TransactionToastType.ERROR}
            message={'Signing Message Failed'}
          />
        ),
        duration: 'short'
      })

      goBack()
    }
  }, [goBack, requestStatus])

  const action: MessageAction = {
    id: request.payload.id,
    site: request.payload.peerMeta,
    method: request.payload.method,
    displayData: data
  }

  return (
    <RpcRequestBottomSheet onClose={rejectAndClose}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <AvaText.LargeTitleBold>Sign Message</AvaText.LargeTitleBold>
        <Space y={30} />
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <OvalTagBg
            style={{
              height: 80,
              width: 80,
              backgroundColor: theme.colorBg3
            }}>
            <Avatar.Custom
              name={action.site?.name ?? ''}
              size={48}
              logoUri={action.site?.icons[0]}
            />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            <AvaText.Body3
              color={theme.colorText1}
              textStyle={{ textAlign: 'center' }}>
              {action.site?.name} requests you to sign the following message
            </AvaText.Body3>
          </View>
          <Space y={18} />
          {
            {
              [RpcMethod.ETH_SIGN]: <EthSign action={action} />,
              [RpcMethod.PERSONAL_SIGN]: <PersonalSign action={action} />,
              [RpcMethod.SIGN_TYPED_DATA]: <SignDataV4 action={action} />
            }[action.method ?? 'unknown']
          }
        </View>
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
      </ScrollView>
    </RpcRequestBottomSheet>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 42,
    paddingHorizontal: 16,
    flexGrow: 1
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  }
})

export default SignMessage
