import { StyleSheet, View } from 'react-native'
import InputText from 'components/InputText'
import React, { useCallback, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import QrScannerAva from 'components/QrScannerAva'
import { Space } from 'components/Space'
import { Tooltip } from 'components/Tooltip'

type Props = {
  onScanned: (qrText: string) => void
}

function DappQrReader({ onScanned }: Props): JSX.Element {
  const theme = useApplicationContext().theme
  const [qrText, setQrText] = useState<string>('')
  const [showMaskOverQR, setShowMaskOverQR] = useState(false)

  const handleQRText = useCallback(
    (value: string) => {
      setQrText(value)
      onScanned(value)
    },
    [onScanned]
  )

  return (
    <View style={styles.modalContainer}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        Scan QR Code
      </AvaText.LargeTitleBold>
      {showMaskOverQR ? (
        <Space y={32} />
      ) : (
        <QrScannerAva
          onSuccess={value => {
            handleQRText(value)
          }}
          vibrate
        />
      )}
      <View style={{ alignSelf: 'baseline', marginLeft: 14 }}>
        <Tooltip
          content={'Use this to manually connect'}
          style={{ width: 200 }}
          position="right">
          Connection URI
        </Tooltip>
      </View>
      <Space y={8} />
      <InputText
        testID="dapp_qr_reader__uri"
        text={qrText}
        onChangeText={handleQRText}
        placeholder={'example: wc:07e46b69-98c4-4...'}
        style={{ backgroundColor: theme.colorBg1 }}
        keyboardWillShow={() => setShowMaskOverQR(true)}
        keyboardDidHide={() => setShowMaskOverQR(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1
  },
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1
  }
})

export default DappQrReader
