import React from 'react'
import { Dimensions } from 'react-native'
import {
  Canvas,
  LinearGradient,
  vec,
  Group,
  Image,
  useImage,
  rrect,
  rect,
  Box,
  SkImage
} from '@shopify/react-native-skia'
import { Space } from 'components/Space'
import { useDispatch } from 'react-redux'
import { ViewOnceKey, setViewOnce } from 'store/viewOnce'
import { useNavigation } from '@react-navigation/native'
import { Row } from 'components/Row'
import { Button, SxProp, Text, View } from '@avalabs/k2-mobile'
import Logger from 'utils/Logger'

const { height, width } = Dimensions.get('screen')

const linearGradientProps = {
  colors: ['#0A84FF', '#0E64BA', '#124D85', '#134370', '#143E65', '#1A1A1C'],
  positions: [0, 0.28, 0.32, 0.36, 0.4, 0.56],
  start: vec(0, 0),
  end: vec(0, height)
}

const BlueBackground = (): JSX.Element => {
  return (
    <Box box={rrect(rect(0, 0, width, height), 8, 8)}>
      <LinearGradient {...linearGradientProps} />
    </Box>
  )
}

const TokenImageWithGradient = ({ image }: { image: SkImage }): JSX.Element => {
  return (
    image && (
      <Image
        image={image}
        x={-300}
        y={-310}
        width={width * 1.9}
        height={height * 0.9}
        fit="contain"
      />
    )
  )
}

interface Props {
  viewOnceKey: ViewOnceKey
  heading: string
  buttonText: string
  descriptions: { icon: JSX.Element; text: string }[]
  styles?: SxProp
}

export default function IntroModal({
  viewOnceKey,
  heading,
  buttonText,
  descriptions,
  styles
}: Props): JSX.Element {
  const dispatch = useDispatch()
  const { goBack } = useNavigation()
  const onInstructionRead = (): void => {
    dispatch(setViewOnce(viewOnceKey))
    goBack()
  }
  const image = useImage(
    require('assets/icons/core_welcome_modal_bg.png'),
    error => Logger.error('Error loading IntroModal SKImage: ', error)
  )

  return (
    <View
      sx={{
        marginTop: 64,
        marginHorizontal: 24,
        borderRadius: 16,
        overflow: 'hidden',
        ...styles
      }}>
      <Canvas
        style={{
          width: width - 48,
          height: '100%',
          position: 'absolute'
        }}>
        <Group>
          <BlueBackground />
          {image && <TokenImageWithGradient image={image} />}
        </Group>
      </Canvas>
      <View
        sx={{
          marginHorizontal: 16,
          height: '100%',
          justifyContent: 'flex-end',
          paddingBottom: 72
        }}>
        <Text variant="heading3">{heading}</Text>
        <Space y={28} />
        {descriptions.map(({ icon, text }, index) => (
          <View key={index}>
            <Row>
              <View style={{ marginTop: 2 }}>{icon}</View>
              <Text
                variant="subtitle1"
                sx={{
                  marginLeft: 16,
                  marginRight: 20
                }}>
                {text}
              </Text>
            </Row>
            <Space y={14} />
          </View>
        ))}
        <Space y={35} />
        <Button type="primary" size="xlarge" onPress={onInstructionRead}>
          {buttonText}
        </Button>
      </View>
    </View>
  )
}
