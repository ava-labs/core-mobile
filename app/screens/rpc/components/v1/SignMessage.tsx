import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import EthSign from 'screens/rpc/components/shared/signMessage/EthSign'
import { ScrollView } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { selectRequestStatus } from 'store/walletConnect'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import isString from 'lodash.isstring'
import { useDappConnectionV1 } from 'hooks/useDappConnectionV1'
import { RpcMethod } from 'store/walletConnectV2'
import {
  oldTypedDataSchema,
  typedDataSchema
} from 'store/walletConnectV2/handlers/eth_sign/schemas/ethSignTypedData'
import SignDataV4 from '../shared/signMessage/SignDataV4'
import PersonalSign from '../shared/signMessage/PersonalSign'
import SignDataV1 from '../shared/signMessage/SignDataV1'

type SignMessageScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SignMessage
>

const SignMessage = () => {
  const { goBack } = useNavigation<SignMessageScreenProps['navigation']>()

  const { request, data } = useRoute<SignMessageScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV1()

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

  const renderMessage = () => {
    switch (request.payload.method) {
      case RpcMethod.ETH_SIGN: {
        if (!isString(data)) return null

        return <EthSign message={data} />
      }
      case RpcMethod.PERSONAL_SIGN: {
        if (!isString(data)) return null

        return <PersonalSign message={data} />
      }
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4: {
        const typedDataSchemaResult = typedDataSchema.safeParse(data)
        const oldTypedDataSchemaResult = oldTypedDataSchema.safeParse(data)

        if (oldTypedDataSchemaResult.success)
          return <SignDataV1 message={oldTypedDataSchemaResult.data} />

        if (typedDataSchemaResult.success)
          return <SignDataV4 message={typedDataSchemaResult.data} />

        return null
      }
    }
  }

  const dappName = request.payload.peerMeta?.name ?? ''
  const dappLogoUri = request.payload.peerMeta?.icons[0]

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
            <Avatar.Custom name={dappName} size={48} logoUri={dappLogoUri} />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            <AvaText.Body3
              color={theme.colorText1}
              textStyle={{ textAlign: 'center' }}>
              {dappName} requests you to sign the following message
            </AvaText.Body3>
          </View>
          <Space y={24} />
          {renderMessage()}
        </View>
        <Space y={24} />
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
