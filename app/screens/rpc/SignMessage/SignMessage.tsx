import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Action, MessageType } from 'navigation/messages/models'
import { SafeAreaView } from 'react-native-safe-area-context'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import OvalTagBg from 'components/OvalTagBg'
import Avatar from 'components/Avatar'
import EthSign from 'screens/rpc/SignMessage/EthSign'
import PersonalSign from 'screens/rpc/SignMessage/PersonalSign'
import SignDataV4 from 'screens/rpc/SignMessage/SignDataV4'
import { NativeViewGestureHandler } from 'react-native-gesture-handler'
import FlexSpacer from 'components/FlexSpacer';

interface Props {
  action: Action
  onCancel: () => void
  onConfirm: () => void
}

const SignMessage: FC<Props> = ({ action, onCancel, onConfirm }) => {
  const theme = useApplicationContext().theme
  const styles = createStyles()
  return (
    <NativeViewGestureHandler>
      <SafeAreaView
        style={{
          paddingTop: 42,
          flex: 1,
          paddingHorizontal: 16
        }}>
        <AvaText.LargeTitleBold>
          {action?.error ? 'Signing Failed' : 'Sign Message'}
        </AvaText.LargeTitleBold>
        <Space y={30} />
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <OvalTagBg
            style={{ height: 80, width: 80, backgroundColor: theme.colorBg3 }}>
            <Avatar.Custom name={'AVAX'} size={48} />
          </OvalTagBg>
          <View style={styles.domainUrlContainer}>
            {/*<AvaText.Heading2 textStyle={{ textAlign: 'center' }}>*/}
            {/*  {title}*/}
            {/*</AvaText.Heading2>*/}
            <AvaText.Body3>
              {action?.site?.domain} requests you to sign the following message
            </AvaText.Body3>
          </View>
          <Space y={16} />
          {
            {
              [MessageType.ETH_SIGN]: <EthSign action={action} />,
              [MessageType.PERSONAL_SIGN]: <PersonalSign action={action} />,
              [MessageType.SIGN_TYPED_DATA]: <SignDataV4 action={action} />
            }[action?.method ?? 'unknown']
          }
        </View>
        <FlexSpacer />
        <View style={styles.actionContainer}>
          <AvaButton.PrimaryMedium onPress={onConfirm}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={21} />
          <AvaButton.SecondaryMedium onPress={onCancel}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      </SafeAreaView>
    </NativeViewGestureHandler>
  )
}

const createStyles = () =>
  StyleSheet.create({
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
