import React from 'react'
import { Dimensions, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import {
  Canvas,
  Rect,
  LinearGradient,
  vec,
  Group,
  Image,
  useImage,
  rrect,
  rect,
  Box,
  Mask
} from '@shopify/react-native-skia'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import CoreOwl from 'assets/icons/core_owl.svg'
import RocketLaunch from 'assets/icons/rocket_launch.svg'
import SearchIcon from 'assets/icons/search.svg'
import { theme } from '@avalabs/k2-mobile/src/theme/theme'
import { useDispatch } from 'react-redux'
import { ViewOnceKey, setViewOnce } from 'store/viewOnce'
import { useNavigation } from '@react-navigation/native'
import { Row } from 'components/Row'

const TO_COLOR = '#000000'
const FROM_COLOR = '#007AFF'

const { height, width } = Dimensions.get('screen')

const BlueBackground = (): JSX.Element => {
  return (
    <Box box={rrect(rect(0, 0, width - 32, height), 8, 8)}>
      <LinearGradient
        start={vec(width * 2.8, 0)}
        end={vec(width + 200, height)}
        colors={[FROM_COLOR, TO_COLOR]}
      />
    </Box>
  )
}

const TokenImageWithGradient = (): JSX.Element => {
  const image = useImage(require('assets/icons/browser_intro_screen_logos.png'))
  return (
    <Mask
      mask={
        <Rect x={0} y={0} height={height / 3} width={width}>
          <LinearGradient
            start={vec(0, height / 15)}
            end={vec(0, height / 3.5)}
            colors={['white', 'transparent']}
          />
        </Rect>
      }>
      {image && (
        <Image
          image={image}
          x={width / 2 - 430}
          y={height / 2 - 530}
          width={width * 2.2}
          height={height / 2}
          fit="contain"
        />
      )}
    </Mask>
  )
}

const HowToUseTheCoreBrowser = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 0 }}>
      <AvaText.Heading3
        textStyle={{
          fontSize: 34,
          lineHeight: 44,
          fontWeight: '700'
        }}>
        How to use the Core Browser...
      </AvaText.Heading3>
    </View>
  )
}

const SearchText = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6>
        Search for a website or browse suggested apps
      </AvaText.Heading6>
    </View>
  )
}

const WalletConnectText = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6>
        On the website find “Connect” then tap Wallet Connect
      </AvaText.Heading6>
    </View>
  )
}

const CoreOwlText = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6
        textStyle={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }}>
        Find core and tap "Connect"
      </AvaText.Heading6>
    </View>
  )
}

const RocketText = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6>Conquer the cryptoverse!</AvaText.Heading6>
    </View>
  )
}

export default function IntroScreen(): JSX.Element {
  const dispatch = useDispatch()
  const { goBack } = useNavigation()
  const onInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.BROWSER_INTERACTION))
    goBack()
  }
  return (
    <View>
      <Canvas
        style={{
          marginHorizontal: 16,
          width: '92%',
          height: '100%',
          position: 'absolute'
        }}>
        <Group>
          <BlueBackground />
          <TokenImageWithGradient />
        </Group>
      </Canvas>
      <View
        style={{
          marginHorizontal: 32,
          height: '100%',
          justifyContent: 'flex-end',
          paddingBottom: 32
        }}>
        <HowToUseTheCoreBrowser />
        <Space y={24} />
        <Row>
          <SearchIcon />
          <SearchText />
        </Row>
        <Space y={16} />
        <Row>
          <WalletConnectSVG color={theme.colors.$neutral50} />
          <WalletConnectText />
        </Row>
        <Space y={16} />
        <Row>
          <CoreOwl width={24} height={24} />
          <CoreOwlText />
        </Row>
        <Space y={16} />
        <Row>
          <RocketLaunch width={24} height={24} />
          <RocketText />
        </Row>
        <Space y={32} />
        <View>
          <AvaButton.PrimaryLarge onPress={onInstructionRead}>
            Get started!
          </AvaButton.PrimaryLarge>
        </View>
      </View>
    </View>
  )
}
