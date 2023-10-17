import React, { FC } from 'react'
import { Dimensions, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import QRCode from 'react-native-qrcode-svg'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import CircularText from 'components/svg/CircularText'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import EthereumSvg from 'components/svg/Ethereum'
import { TokenSymbol } from 'store/network'

interface Props {
  address?: string
  sizePercentage?: number
  token?: string
  label?: string
  testID?: string
}

const { width: screenWidth } = Dimensions.get('window')

const AvaxQRCode: FC<Props> = ({
  address,
  sizePercentage = 1,
  token = TokenSymbol.AVAX,
  label = ''
}: Props) => {
  const { theme } = useApplicationContext()
  const logoColor = theme.colorIcon1
  const logoBgColor = theme.colorBg1
  const borderWidth = 16
  const containerSize = screenWidth * sizePercentage
  const qrCodeSize = containerSize - borderWidth * 2
  const qrTokenSize = qrCodeSize * 0.3
  const circularTextSize = (qrTokenSize * 100) / 40

  const qrToken = (): JSX.Element => {
    switch (token) {
      case TokenSymbol.BTC:
        return (
          <BitcoinSVG
            absolutePosition
            backgroundColor={logoBgColor}
            size={qrTokenSize}
          />
        )
      case TokenSymbol.ETH:
        return <EthereumSvg absolutePosition size={qrTokenSize} />
      case TokenSymbol.AVAX:
      default:
        return (
          <AvaLogoSVG
            absolutePosition
            backgroundColor={logoBgColor}
            logoColor={logoColor}
            size={qrTokenSize}
          />
        )
    }
  }

  return (
    <View
      style={{
        borderWidth: borderWidth,
        height: containerSize,
        borderColor: theme.alternateBackground,
        borderRadius: 7
      }}>
      <QRCode ecl={'H'} size={qrCodeSize} value={address} />
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
        <CircularText text={label} size={circularTextSize} />
      </View>
    </View>
  )
}

export default AvaxQRCode
