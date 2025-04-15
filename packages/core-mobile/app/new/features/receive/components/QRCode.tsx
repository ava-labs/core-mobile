import { SCREEN_WIDTH, useTheme } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React, { FC } from 'react'
import { View } from 'react-native'
import RNQRCode from 'react-native-qrcode-svg'
import { TokenSymbol } from 'store/network'
import { CircularText } from './CircularText'

interface Props {
  address?: string
  token?: string
  label?: string
  testID?: string
}

export const QRCode: FC<Props> = ({
  address,
  token = TokenSymbol.AVAX,
  label = ''
}: Props) => {
  const { theme } = useTheme()

  const containerSize = SCREEN_WIDTH * 0.6
  const qrCodeSize = containerSize
  const qrTokenSize = qrCodeSize * 0.3
  const circularTextSize = (qrTokenSize * 100) / 40

  const qrToken = (): JSX.Element => {
    switch (token) {
      case TokenSymbol.BTC:
        return <TokenLogo size={qrTokenSize} symbol={TokenSymbol.BTC} />
      case TokenSymbol.ETH:
        return <TokenLogo size={qrTokenSize} symbol={TokenSymbol.ETH} />
      case TokenSymbol.AVAX:
      default:
        return <TokenLogo size={qrTokenSize} symbol={TokenSymbol.AVAX} />
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
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          {qrToken()}
        </View>
        <CircularText text={label} size={circularTextSize} />
      </View>
    </View>
  )
}
