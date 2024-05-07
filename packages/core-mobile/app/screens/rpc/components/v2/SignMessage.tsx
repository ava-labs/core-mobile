import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import { ScrollView } from 'react-native-gesture-handler'
import isString from 'lodash.isstring'
import FlexSpacer from 'components/FlexSpacer'
import { RpcMethod } from 'store/rpc/types'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import RpcRequestBottomSheet from 'screens/rpc/components/shared/RpcRequestBottomSheet'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { truncateAddress } from 'utils/Utils'
import { NetworkLogo } from 'screens/network/NetworkLogo'
import { Row } from 'components/Row'
import {
  oldTypedDataSchema,
  typedDataSchema
} from 'store/rpc/handlers/eth_sign/schemas/ethSignTypedData'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import EthSign from '../shared/signMessage/EthSign'
import SignDataV4 from '../shared/signMessage/SignDataV4'
import PersonalSign from '../shared/signMessage/PersonalSign'
import SignDataV1 from '../shared/signMessage/SignDataV1'

type SignMessageScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.SignMessageV2
>

const SignMessage = (): JSX.Element | null => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack } = useNavigation<SignMessageScreenProps['navigation']>()

  const { request, data, network, account } =
    useRoute<SignMessageScreenProps['route']>().params

  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()

  const theme = useApplicationContext().theme

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { data, network, account })
    goBack()
  }, [onApprove, request, data, network, account, goBack])

  const dappName = request.peerMeta.name
  const dappLogoUri = request.peerMeta.icons[0]

  if (!account || !network) return null

  const renderNetwork = (): JSX.Element => {
    return (
      <View style={styles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Heading3>Network:</AvaText.Heading3>
          <Row>
            <NetworkLogo
              key={network.chainId}
              logoUri={network.logoUri}
              size={24}
              style={{ marginRight: 8 }}
            />
            <AvaText.ButtonMedium textStyle={{ color: theme.colorText1 }}>
              {network.chainName}
            </AvaText.ButtonMedium>
          </Row>
        </Row>
        <Space y={24} />
      </View>
    )
  }

  const renderAccount = (): JSX.Element => {
    const accountAddress = ` (${truncateAddress(account.addressC, 5)})`

    return (
      <View style={styles.fullWidthContainer}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Heading3>Account:</AvaText.Heading3>
          <Space y={4} />
          <Row>
            <AvaText.ButtonMedium textStyle={{ color: theme.colorText1 }}>
              {account.name}
            </AvaText.ButtonMedium>
            <AvaText.ButtonMedium
              textStyle={{ color: theme.colorText1, fontWeight: 'normal' }}>
              {accountAddress}
            </AvaText.ButtonMedium>
          </Row>
        </Row>
      </View>
    )
  }

  const renderMessage = (): JSX.Element | null => {
    switch (request.method) {
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

  return (
    <>
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
            {renderNetwork()}
            {renderAccount()}
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
      {isSeedlessSigningBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Signing is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </>
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
  },
  fullWidthContainer: {
    width: '100%'
  }
})

export default SignMessage
