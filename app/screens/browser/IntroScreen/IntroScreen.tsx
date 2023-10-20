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
import { Row } from 'components/Row'
import WalletConnectSVG from 'components/svg/WalletConnectSVG'
import CoreOwl from 'assets/icons/core_owl.svg'
import RocketLaunch from 'assets/icons/rocket_launch.svg'
import SearchIcon from 'assets/icons/search.svg'
import { useDispatch } from 'react-redux'
import { setViewOnce, ViewOnceKey } from 'store/viewOnce'

const TOO_COLOR = '#000000'
const FROM_COLOR = '#007AFF'

const { height, width } = Dimensions.get('screen')

const BlueBackground = (): JSX.Element => {
  return (
    <Box box={rrect(rect(0, 0, 358, 640), 8, 8)}>
      <LinearGradient
        start={vec(1300, 0)}
        end={vec(width + 200, height)}
        colors={[FROM_COLOR, TOO_COLOR]}
      />
    </Box>
  )
}

const TokenImageWithGradient = (): JSX.Element => {
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
        <Image image={image} x={-145} y={-219} width={695} height={623} />
      )}
    </Mask>
  )
}

const HowToUseTheCoreBrowser = (): JSX.Element | null => {
  return (
    <View style={{ paddingHorizontal: 32 }}>
      <AvaText.Heading3
        textStyle={{ fontSize: 34, lineHeight: 44, fontWeight: '700' }}>
        How to use the Core Browser...
      </AvaText.Heading3>
    </View>
  )
}

const SearchText = (): JSX.Element | null => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6
        textStyle={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }}>
        Search for a website or browse suggested apps
      </AvaText.Heading6>
    </View>
  )
}

const WalletConnectText = (): JSX.Element | null => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6
        textStyle={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }}>
        On the website find “Connect” then tap Wallet Connect
      </AvaText.Heading6>
    </View>
  )
}

const CoreOwlText = (): JSX.Element | null => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6
        textStyle={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }}>
        Find core and tap "Connect"
      </AvaText.Heading6>
    </View>
  )
}

const RocketText = (): JSX.Element | null => {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <AvaText.Heading6
        textStyle={{ fontSize: 16, lineHeight: 24, fontWeight: '700' }}>
        Conquer the cryptoverse!
      </AvaText.Heading6>
    </View>
  )
}

export default function IntroScreen(): JSX.Element | null {
  const dispatch = useDispatch()

  const onInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.CHART_INTERACTION))
  }
  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ marginTop: 290, zIndex: 1, position: 'absolute' }}>
        <HowToUseTheCoreBrowser />
        <Space y={16} />
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ paddingLeft: 32 }}>
            <SearchIcon />
          </View>
          <View style={{ flex: 1, marginRight: -16 }}>
            <SearchText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ paddingLeft: 32 }}>
            <WalletConnectSVG color="white" />
          </View>
          <View style={{ flex: 1, marginRight: -16 }}>
            <WalletConnectText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ paddingLeft: 32 }}>
            <CoreOwl width={24} height={24} />
          </View>
          <View style={{ flex: 1, marginRight: -16 }}>
            <CoreOwlText />
          </View>
        </Row>
        <Space y={16} />
        <Row style={{ alignItems: 'flex-end' }}>
          <View style={{ paddingLeft: 32 }}>
            <RocketLaunch />
          </View>
          <View style={{ flex: 1, marginRight: -16 }}>
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
          paddingBottom: 45,
          width: '100%'
        }}>
        <AvaButton.PrimaryLarge onPress={onInstructionRead}>
          Get started!
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}
