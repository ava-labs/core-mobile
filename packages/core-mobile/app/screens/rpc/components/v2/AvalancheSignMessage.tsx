import React, { useCallback, useContext } from 'react'
import { StyleSheet } from 'react-native'
import { Space } from 'components/Space'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import { ScrollView } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'
import { useSelector } from 'react-redux'
import { selectIsSeedlessSigningBlocked } from 'store/posthog'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { Button, Text, useTheme, View } from '@avalabs/k2-mobile'
import { Sheet } from 'components/Sheet'
import AvaText from 'components/AvaText'
import { ApplicationContext } from 'contexts/ApplicationContext'
import { toUtf8 } from 'ethereumjs-util'

type AvalancheSignMessageScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.AvalancheSignMessage
>

export const AvalancheSignMessage = (): JSX.Element | null => {
  const isSeedlessSigningBlocked = useSelector(selectIsSeedlessSigningBlocked)
  const { goBack } =
    useNavigation<AvalancheSignMessageScreenProps['navigation']>()
  const {
    request,
    data: { message, accountIndex }
  } = useRoute<AvalancheSignMessageScreenProps['route']>().params
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const {
    theme: { colors }
  } = useTheme()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    goBack()
  }, [goBack, onReject, request])

  const approveAndClose = useCallback(() => {
    onApprove(request, { message, accountIndex })
    goBack()
  }, [onApprove, request, message, accountIndex, goBack])

  const dappName = request.peerMeta.name
  const dappLogoUri = request.peerMeta.icons[0]

  const renderApproveRejectButtons = (): JSX.Element => {
    return (
      <>
        <FlexSpacer />
        <View sx={{ flex: 0, paddingVertical: 40, paddingHorizontal: 14 }}>
          <Button type="primary" size="xlarge" onPress={approveAndClose}>
            Approve
          </Button>
          <Space y={16} />
          <Button type="secondary" size="xlarge" onPress={rejectAndClose}>
            Reject
          </Button>
        </View>
      </>
    )
  }

  return (
    <>
      <Sheet onClose={rejectAndClose} title="Sign Message">
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <OvalTagBg
              style={{
                height: 80,
                width: 80,
                backgroundColor: colors.$neutral800
              }}>
              <Avatar.Custom name={dappName} size={48} logoUri={dappLogoUri} />
            </OvalTagBg>
            <View sx={styles.domainUrlContainer}>
              <Text
                variant="helperText"
                sx={{
                  textAlign: 'center',
                  color: '$neutral50',
                  lineHeight: 15
                }}>
                {dappName} requests you to sign the following message
              </Text>
            </View>
            <Space y={24} />
            <PersonalSign message={message} />
          </View>
          <Space y={24} />
          {renderApproveRejectButtons()}
        </ScrollView>
      </Sheet>
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

const PersonalSign = ({ message }: { message: string }): JSX.Element => {
  const theme = useContext(ApplicationContext).theme

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <AvaText.Heading3>Message:</AvaText.Heading3>
      <Space y={8} />
      <ScrollView
        style={{
          maxHeight: 250,
          backgroundColor: theme.colorBg3,
          borderRadius: 8,
          padding: 8
        }}>
        <AvaText.Body1>{toUtf8(message)}</AvaText.Body1>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    paddingTop: 30,
    paddingHorizontal: 16,
    flexGrow: 1
  },
  domainUrlContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  }
})
