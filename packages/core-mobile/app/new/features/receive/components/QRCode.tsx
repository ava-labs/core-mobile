import { SCREEN_WIDTH, useTheme } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import RNQRCode from 'react-native-qrcode-svg'

interface Props {
  address?: string
  testID?: string
}

const CONTAINER_SIZE = SCREEN_WIDTH * 0.6

export const QRCode: FC<Props> = ({ address }: Props) => {
  const { theme } = useTheme()

  return (
    <RNQRCode
      testID="receive_token_qr_code"
      ecl={'H'}
      size={CONTAINER_SIZE}
      value={address}
      color={theme.colors.$textPrimary}
      backgroundColor={theme.colors.$surfacePrimary}
    />
  )
}
