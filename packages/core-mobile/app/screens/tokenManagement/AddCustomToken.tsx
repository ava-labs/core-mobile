import React, { FC, useCallback, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import InputText from 'components/InputText'
import QrScannerAva from 'components/QrScannerAva'
import AvaButton from 'components/AvaButton'
import QRCode from 'components/svg/QRCodeSVG'
import { useNavigation } from '@react-navigation/native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import Avatar from 'components/Avatar'
import useAddCustomToken from 'screens/tokenManagement/hooks/useAddCustomToken'
import { ShowSnackBar } from 'components/Snackbar'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { MaliciousTokenWarningCard } from 'components/MaliciousTokenWarningCard'
import { isTokenMalicious } from 'utils/isTokenMalicious'

const AddCustomToken: FC = () => {
  const theme = useApplicationContext().theme
  const [showQrScanner, setShowQrScanner] = useState(false)
  const { goBack } = useNavigation()

  const showSuccess = useCallback(() => {
    ShowSnackBar('Added!')
    goBack()
  }, [goBack])

  const {
    tokenAddress,
    setTokenAddress,
    errorMessage,
    token,
    addCustomToken,
    isLoading
  } = useAddCustomToken(showSuccess)

  const isMalicious = token && isTokenMalicious(token)

  // only enable button if we have token and no error message
  const disabled = !!(errorMessage || !token || isLoading)

  const handleQrCodeScanSuccess = (data: string): void => {
    setTokenAddress(data)
    setShowQrScanner(false)
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        justifyContent: 'space-between'
      }}>
      <View style={styles.horizontalLayout}>
        <View style={[{ flex: 1, paddingStart: 4, paddingEnd: 4 }]}>
          <InputText
            testID="tokenAddress"
            minHeight={72}
            label={'Token contract address'}
            placeholder="Token contract address"
            multiline={true}
            errorText={errorMessage}
            onChangeText={setTokenAddress}
            text={tokenAddress}
          />
          {tokenAddress.length === 0 && (
            <View
              style={{
                position: 'absolute',
                right: 24,
                top: 40
              }}>
              <AvaButton.Icon onPress={() => setShowQrScanner(true)}>
                <QRCode />
              </AvaButton.Icon>
            </View>
          )}
          {isMalicious && (
            <>
              <Space y={16} />
              <MaliciousTokenWarningCard />
            </>
          )}
        </View>
      </View>

      {!!token && (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {/* placeholder for image or initials if there's no image available*/}
          <Avatar.Custom
            name={token.name ?? ''}
            symbol={token.symbol}
            size={88}
          />
          <Space y={16} />
          <AvaText.Heading2>{token.name}</AvaText.Heading2>
        </View>
      )}

      <AvaButton.PrimaryLarge
        disabled={disabled}
        style={{ margin: 16 }}
        onPress={addCustomToken}>
        Add
      </AvaButton.PrimaryLarge>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQrScanner(false)}
        visible={showQrScanner}>
        <QrScannerAva
          onSuccess={handleQrCodeScanSuccess}
          onCancel={() => setShowQrScanner(false)}
        />
      </Modal>

      {isLoading && (
        <ActivityIndicator
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: '50%'
          }}
          size={'large'}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalLayout: {
    paddingTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default AddCustomToken
