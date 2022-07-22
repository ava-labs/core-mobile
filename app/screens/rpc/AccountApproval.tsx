import AvaText from 'components/AvaText'
import React from 'react'
import { Button, Image, Text, View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import OvalTagBg from 'components/OvalTagBg'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { useWalletStateContext } from '@avalabs/wallet-react-components'

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

const AccountApproval = props => {
  const { description, icon, url, title } = props.currentPageInformation
  const theme = useApplicationContext().theme
  const styles = createStyles()
  const { addresses } = useWalletStateContext()!

  return (
    <SafeAreaView
      style={{ backgroundColor: theme.background, paddingTop: 42, flex: 1 }}>
      <AvaText.LargeTitleBold>Connect to site?</AvaText.LargeTitleBold>
      <Space y={30} />
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <OvalTagBg
          style={{ height: 80, width: 80, backgroundColor: theme.colorBg3 }}>
          <Avatar.Custom name={'dapp'} logoUri={icon} size={48} />
        </OvalTagBg>
        <View style={styles.domainUrlContainer}>
          <AvaText.Heading2 textStyle={{ textAlign: 'center' }}>
            {title}
          </AvaText.Heading2>
          <AvaText.Body3>{url}</AvaText.Body3>
        </View>
        <Space y={16} />
        <AvaText.Body2 color={theme.colorError}>
          By clicking connect, you allow this dapp to view your public address.
          This is an important security step to protect your data from potential
          phishing risks
        </AvaText.Body2>
        <Space y={16} />
      </View>

      <View style={styles.accountCardWrapper}>
        <Space y={16} />
        <AvaText.Body1>{addresses.addrC}</AvaText.Body1>
        <Space y={16} />
      </View>
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium onPress={() => props.onConfirm()}>
          Approve
        </AvaButton.PrimaryMedium>
        <Space y={21} />
        <AvaButton.SecondaryMedium onPress={() => props.onCancel()}>
          Reject
        </AvaButton.SecondaryMedium>
      </View>
    </SafeAreaView>
  )
}

export default AccountApproval
