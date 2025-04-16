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

export const QRCode: FC<Props> = ({ address, token, label }: Props) => {
  const { theme } = useTheme()

  const containerSize = SCREEN_WIDTH * 0.6
  const qrCodeSize = containerSize
  const qrTokenSize = qrCodeSize * 0.372
  const circularTextSize = qrTokenSize * 2
  const iconSize = qrTokenSize * 0.8

  const logoSize = qrCodeSize / 2.1

  const qrToken = (): JSX.Element => {
    switch (token) {
      case TokenSymbol.BTC:
        return (
          <BTCSymbol
            width={iconSize}
            height={iconSize}
            color={theme.colors.$surfacePrimary}
          />
        )
      case TokenSymbol.AVAX:
        return (
          <AVAXSymbol
            width={iconSize}
            height={iconSize}
            color={theme.colors.$surfacePrimary}
          />
        )
      default:
        return <AVAXSymbol width={iconSize} height={iconSize} />
    }
  }

  return (
    <View
      style={{
        height: containerSize,
        width: containerSize
      }}>
      <RNQRCode
        ecl={'H'}
        size={qrCodeSize}
        logoSize={logoSize}
        logoBackgroundColor={theme.colors.$surfacePrimary}
        logoBorderRadius={qrCodeSize}
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
              width: qrTokenSize,
              height: qrTokenSize,
              backgroundColor: theme.colors.$textPrimary,
              borderRadius: qrTokenSize / 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {qrToken()}
          </View>
        </View>
        <CircularText
          text={label ?? ''}
          size={circularTextSize}
          textColor={theme.colors.$textPrimary}
          circleBackgroundColor={theme.colors.$surfacePrimary}
        />
      </View>
    </View>
  )
}
