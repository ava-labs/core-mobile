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
  Mask,
  Text,
  useFont
} from '@shopify/react-native-skia'

// const WINDOW_WIDTH = Dimensions.get('window').width
// const WINDOW_HEIGHT = Dimensions.get('window').height

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
  const image = useImage(require('assets/icons/browser_intro_screen_logos.jpg'))
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
  const font = useFont(require('assets/fonts/Inter-Bold.ttf'), 34)
  if (!font) {
    return null
  }
  return (
    <Group>
      <Text x={16} y={250} text="How to use the" font={font} color={'white'} />
      <Text x={16} y={292} text="Core browser..." font={font} color={'white'} />
    </Group>
  )
}

const SearchIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/search_dark.png'))
  if (!image) {
    return null
  }
  return (
    <Image image={image} fit="contain" x={16} y={328} width={24} height={24} />
  )
}

const SearchText = (): JSX.Element | null => {
  const smallFont = useFont(require('assets/fonts/Inter-Bold.ttf'), 16)

  if (!smallFont) {
    return null
  }
  return (
    <Group>
      <Text
        x={55}
        y={345}
        text="Search for a website or browse"
        font={smallFont}
        color={'white'}
      />
      <Text
        x={55}
        y={369}
        text="suggested apps"
        font={smallFont}
        color={'white'}
      />
    </Group>
  )
}

const WalletConnectIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/wallet_connect.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={391} width={24} height={24} />
}

const WalletConnectText = (): JSX.Element | null => {
  const smallFont = useFont(require('assets/fonts/Inter-Bold.ttf'), 16)

  if (!smallFont) {
    return null
  }
  return (
    <Group>
      <Text
        x={55}
        y={408}
        text="On the website find “Connect”"
        font={smallFont}
        color={'white'}
      />
      <Text
        x={55}
        y={433}
        text="then tap Wallet Connect"
        font={smallFont}
        color={'white'}
      />
    </Group>
  )
}

const CoreOwlIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/core_owl_icon.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={454} width={24} height={24} />
}

const CoreOwlText = (): JSX.Element | null => {
  const smallFont = useFont(require('assets/fonts/Inter-Bold.ttf'), 16)

  if (!smallFont) {
    return null
  }
  return (
    <Group>
      <Text
        x={55}
        y={472}
        text="Find Core and tap “Connect”"
        font={smallFont}
        color={'white'}
      />
    </Group>
  )
}

const RocketIcon = (): JSX.Element | null => {
  const image = useImage(require('assets/icons/rocket_launch.png'))
  if (!image) {
    return null
  }
  return <Image image={image} x={16} y={495} width={24} height={24} />
}

const RocketText = (): JSX.Element | null => {
  const smallFont = useFont(require('assets/fonts/Inter-Bold.ttf'), 16)

  if (!smallFont) {
    return null
  }
  return (
    <Group>
      <Text
        x={55}
        y={512}
        text="Conquer the cryptoverse!"
        font={smallFont}
        color={'white'}
      />
    </Group>
  )
}

export default function IntroScreen(): JSX.Element | null {
  return (
    <View style={{ flex: 1 }}>
      <Canvas
        style={{
          flex: 1,
          marginLeft: 16,
          marginTop: 70,
          marginRight: 16,
          marginBottom: 80
        }}>
        <Group>
          <BlueBackground />
          <TokenImageWithGradient />
        </Group>
        <HowToUseTheCoreBrowser />
        <SearchIcon />
        <SearchText />
        <WalletConnectIcon />
        <WalletConnectText />
        <CoreOwlIcon />
        <CoreOwlText />
        <RocketIcon />
        <RocketText />
      </Canvas>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 32,
          paddingBottom: 95,
          width: '80%'
        }}>
        <AvaButton.PrimaryLarge>Get started!</AvaButton.PrimaryLarge>
      </View>
    </View>
  )
}
