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
import { MessageAction, RpcMethod } from 'services/walletconnect/types'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { EthSignRpcRequest } from 'store/rpc/handlers/eth_sign'

interface Props {
  dappEvent: EthSignRpcRequest
  onReject: (request: EthSignRpcRequest, message?: string) => void
  onApprove: (request: EthSignRpcRequest, result?: unknown) => void
  onClose: () => void
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
      onClose()
    }
  }, [dappEvent, onClose])

  const action: MessageAction = {
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
        {action?.error ? 'Signing Failed' : 'Sign Message'}
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
            onClose()
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
    paddingBottom: 70,
    flexGrow: 1
  },
  root: {
    paddingTop: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 200,
    paddingBottom: 20
  },
  accountCardWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#C4C4C4'
  },
  intro: {
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16
  },
  warning: {
    color: 'red',
    paddingHorizontal: 24,
    marginVertical: 16,
    fontSize: 14,
    width: '100%',
    textAlign: 'center'
  },
  actionContainer: {
    flex: 0,
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  button: {
    flex: 1
  },
  cancel: {
    marginRight: 8
  },
  confirm: {
    marginLeft: 8
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  domainUrl: {
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
    color: 'black'
  }
})

export default SignMessage
