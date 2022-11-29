import React, { FC, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
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
import { GenericAction, RpcMethod } from 'services/walletconnect/types'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { EthSignRpcRequest } from 'store/rpc/handlers/eth_sign'

interface Props {
  dappEvent: EthSignRpcRequest
  onReject: (request: EthSignRpcRequest, message?: string) => void
  onApprove: (request: EthSignRpcRequest) => void
  onClose: (request: EthSignRpcRequest) => void
}

const SignMessage: FC<Props> = ({
  onReject,
  onApprove,
  dappEvent,
  onClose
}) => {
  const theme = useApplicationContext().theme
  const [submitting, setSubmitting] = useState(false)
  const [signFailedError, setSignFailedError] = useState<string>()

  useEffect(() => {
    if (dappEvent.error) {
      showSnackBarCustom({
        component: (
          <TransactionToast
            type={TransactionToastType.ERROR}
            message={'Signing Message Failed'}
          />
        ),
        duration: 'short'
      })
      onClose(dappEvent)
    }
  }, [dappEvent, onClose])

  const action: GenericAction = {
    id: dappEvent.payload?.id,
    site: dappEvent.payload?.peerMeta,
    method: dappEvent.payload?.method,
    displayData: dappEvent.data
  }
  function onHandleApprove() {
    setSubmitting(true)
    setSignFailedError(undefined)
    onApprove(dappEvent)
    setSubmitting(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <AvaText.LargeTitleBold>
        {signFailedError ? 'Signing Failed' : 'Sign Message'}
      </AvaText.LargeTitleBold>
      <Space y={30} />
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <OvalTagBg
          style={{
            height: 80,
            width: 80,
            backgroundColor: theme.colorBg3
          }}>
          <Avatar.Custom
            name={action?.site?.name ?? ''}
            size={48}
            logoUri={action?.site?.icons[0]}
          />
        </OvalTagBg>
        <View style={styles.domainUrlContainer}>
          <AvaText.Body3
            color={theme.colorText1}
            textStyle={{ textAlign: 'center' }}>
            {action?.site?.name} requests you to sign the following message
          </AvaText.Body3>
        </View>
        <Space y={18} />
        {
          {
            [RpcMethod.ETH_SIGN]: <EthSign action={action} />,
            [RpcMethod.PERSONAL_SIGN]: <PersonalSign action={action} />,
            [RpcMethod.SIGN_TYPED_DATA]: <SignDataV4 action={action} />
          }[action?.method ?? 'unknown']
        }
      </View>
      <FlexSpacer />
      {!!signFailedError && (
        <AvaText.Body1 color={theme.colorError}>
          {signFailedError}
        </AvaText.Body1>
      )}
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium
          disabled={submitting}
          onPress={onHandleApprove}>
          {submitting && <ActivityIndicator />} Approve
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
    </ScrollView>
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
