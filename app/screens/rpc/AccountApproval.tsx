import React from 'react'
import { Button, Image, Text, View, StyleSheet } from 'react-native'

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
      marginBottom: 16,
      fontSize: 14,
      width: '100%',
      textAlign: 'center'
    },
    actionContainer: {
      flex: 0,
      flexDirection: 'row',
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
    domanUrlContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
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
  const styles = createStyles()

  return (
    <View style={styles.root}>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Image source={{ uri: icon }} width={40} height={40} />
        <View style={styles.domanUrlContainer}>
          <Text style={styles.domainUrl}>{title}</Text>
          <Text style={styles.domainUrl}>{url}</Text>
        </View>
      </View>
      <Text style={styles.intro}>Connect to this site?</Text>
      <Text style={styles.warning}>
        By clicking connect, you allow this dapp to view your public address.
        This is an important security step to protect your data from potential
        phishing risks
      </Text>
      <View style={styles.accountCardWrapper}>
        <Text>0xF28f762F83818645e0C6a421a0BC9eDecbB25668</Text>
      </View>
      <View style={styles.actionContainer}>
        <Button
          onPress={() => props.onCancel()}
          containerStyle={[styles.button, styles.cancel]}
          title={'Reject'}
        />
        <Button
          onPress={() => props.onConfirm()}
          containerStyle={[styles.button, styles.confirm]}
          title={'Approve'}
        />
      </View>
    </View>
  )
}

export default AccountApproval
