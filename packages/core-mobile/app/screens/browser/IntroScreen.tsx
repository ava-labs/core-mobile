import React from 'react'
import { Dimensions, View, Platform } from 'react-native'
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
import { Row } from 'components/Row'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import CoreOwl from 'assets/icons/core_owl.svg'
import RocketLaunch from 'assets/icons/rocket_launch.svg'
import SearchIcon from 'assets/icons/search.svg'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

const TO_COLOR = '#000000'
const FROM_COLOR = '#007AFF'

const { height, width } = Dimensions.get('screen')

const BlueBackground = (): JSX.Element => {
  return (
    <Box box={rrect(rect(0, 0, 358, 640), 8, 8)}>
      <LinearGradient
        start={vec(width + 900, 0)}
        end={vec(width + 200, height)}
        colors={[FROM_COLOR, TO_COLOR]}
      />
    </Box>
  )
}

const TokenImageWithGradient = (): JSX.Element => {
  const platform = Platform.OS
  const imageWidth = platform === 'ios' ? width + 300 : width + 250
  const image = useImage(require('assets/icons/browser_intro_screen_logos.png'))
  return (
    <Mask
      mask={
        <Rect x={0} y={0} height={height / 2} width={width}>
          <LinearGradient
            start={vec(0, -100)}
            end={vec(0, height / 3.7)}
            colors={['white', 'transparent']}
          />
        </Rect>
      }>
      {image && (
        <Image
          image={image}
          x={-150}
          y={-219}
          width={imageWidth}
          height={height - 210}
          fit="contain"
        />
      )}
    </Mask>
  )
}

const HowToUseTheCoreBrowser = (): JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 32 }}>
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
  const onInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.BROWSER_INTERACTION))
  }
  const topPadding = height * 0.33

  const bottomPadding = (): number => {
    if (Platform.OS === 'ios') {
      return height > 725 ? 105 : 45
    } else {
      return height > 725 ? 75 : 40
    }
  }

  const rightMargin = (): number => {
    if (Platform.OS === 'ios') {
      return -16
    } else {
      return -32
    }
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View
        style={{
          marginTop: topPadding,
          zIndex: 1,
          position: 'absolute'
        }}>
        <HowToUseTheCoreBrowser />
        <Space y={16} />
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ paddingLeft: 32 }}>
            <SearchIcon />
          </View>
          <View style={{ flex: 1, marginRight: rightMargin() }}>
            <SearchText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ paddingLeft: 32 }}>
            <WalletConnectSVG color="white" />
          </View>
          <View style={{ flex: 1, marginRight: rightMargin() }}>
            <WalletConnectText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ paddingLeft: 32 }}>
            <CoreOwl width={24} height={24} />
          </View>
          <View style={{ flex: 1, marginRight: rightMargin() }}>
            <CoreOwlText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ paddingLeft: 32 }}>
            <RocketLaunch />
          </View>
          <View style={{ flex: 1, marginRight: rightMargin() }}>
            <RocketText />
          </View>
        </Row>
      </View>
      <Canvas
        style={{
          flex: 1,
          marginTop: 70,
          marginBottom: 80
        }}>
        <Group>
          <BlueBackground />
          <TokenImageWithGradient />
        </Group>
      </Canvas>
      <View
        style={{
          flex: 1,
          position: 'absolute',
          alignContent: 'center',
          bottom: 0,
          left: 16,
          paddingHorizontal: 16,
          paddingBottom: bottomPadding(),
          width: '100%'
        }}>
        <AvaButton.PrimaryLarge onPress={onInstructionRead}>
          Get started!
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}
