import { SCREEN_WIDTH, useTheme } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import { View } from 'react-native'
import RNQRCode from 'react-native-qrcode-svg'
import { TokenSymbol } from 'store/network'

import AVAXSymbol from '../../../assets/icons/AVAX-symbol.svg'
import BTCSymbol from '../../../assets/icons/BTC-symbol.svg'
import QRPlaceholder from '../../../assets/icons/qr_placeholder.png'

import { CircularText } from './CircularText'

interface Props {
  address?: string
  token?: string
  label?: string
  testID?: string
}

const CONTAINER_SIZE = SCREEN_WIDTH * 0.6
const QR_CODE_SIZE = CONTAINER_SIZE
const QR_TOKEN_SIZE = QR_CODE_SIZE * 0.372
const CIRCULAR_TEXT_SIZE = QR_TOKEN_SIZE * 2
const ICON_SIZE = QR_TOKEN_SIZE * 0.8
const LOGO_SIZE = QR_CODE_SIZE / 2.1

export const QRCode: FC<Props> = ({ address, token, label }: Props) => {
  const { theme } = useTheme()

  const qrToken = (): JSX.Element => {
    if (token === TokenSymbol.BTC) {
      return (
        <BTCSymbol
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={theme.colors.$surfacePrimary}
        />
      )
    }
    return (
      <AVAXSymbol
        width={ICON_SIZE}
        height={ICON_SIZE}
        color={theme.colors.$surfacePrimary}
      />
    )
  }

  return (
    <View
      style={{
        height: CONTAINER_SIZE,
        width: CONTAINER_SIZE
      }}>
      <RNQRCode
        ecl={'H'}
        size={QR_CODE_SIZE}
        logoSize={LOGO_SIZE}
        logoBackgroundColor={theme.colors.$surfacePrimary}
        logoBorderRadius={QR_CODE_SIZE}
        logo={QRPlaceholder}
        value={address}
        color={theme.colors.$textPrimary}
        backgroundColor={theme.colors.$surfacePrimary}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View
          style={{
            position: 'absolute'
          }}>
          <View
            style={{
              width: QR_TOKEN_SIZE,
              height: QR_TOKEN_SIZE,
              backgroundColor: theme.colors.$textPrimary,
              borderRadius: QR_TOKEN_SIZE / 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {qrToken()}
          </View>
        </View>
        <CircularText
          text={label ?? ''}
          size={CIRCULAR_TEXT_SIZE}
          textColor={theme.colors.$textPrimary}
          circleBackgroundColor={theme.colors.$surfacePrimary}
        />
      </View>
    </View>
  )
}
