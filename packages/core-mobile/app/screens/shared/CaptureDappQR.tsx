import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useRoute } from '@react-navigation/native'
import DappQrReader from 'screens/rpc/DappQrReader'
import React from 'react'

type QRCodeScreenProps = WalletScreenProps<typeof AppNavigation.Wallet.QRCode>

const CaptureDappQR = () => {
  const { params } = useRoute<QRCodeScreenProps['route']>()

  const onScanned = (qrText: string) => params.onScanned(qrText)

  return <DappQrReader onScanned={onScanned} />
}

export default CaptureDappQR
