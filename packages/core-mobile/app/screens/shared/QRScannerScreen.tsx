import { useNavigation, useRoute } from '@react-navigation/native'
import QrScannerAva from 'components/QrScannerAva'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import React, { FC } from 'react'

const QRScannerScreen: FC<ScreenProps> = () => {
  const { params } = useRoute<ScreenProps['route']>()
  const { goBack } = useNavigation()
  const { onSuccess, onCancel } = params

  const handleSuccess = (data: string): void => {
    goBack()
    onSuccess(data)
  }

  const handleCancel = (): void => {
    goBack()
    onCancel?.()
  }

  return <QrScannerAva onSuccess={handleSuccess} onCancel={handleCancel} />
}

type ScreenProps = WalletScreenProps<typeof AppNavigation.Modal.QRScanner>

export default QRScannerScreen
