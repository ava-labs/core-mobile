import React from 'react'
import { Dimensions } from 'react-native'
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
import { Space } from 'components/Space'
import { useDispatch } from 'react-redux'
import { ViewOnceKey, setViewOnce } from 'store/viewOnce'
import { useNavigation } from '@react-navigation/native'
import { Row } from 'components/Row'
import { Button, SxProp, Text, View } from '@avalabs/k2-mobile'

const TO_COLOR = '#000000'
const FROM_COLOR = '#007AFF'

const { height, width } = Dimensions.get('screen')

const BlueBackground = (): JSX.Element => {
  return (
    <Box box={rrect(rect(0, 0, width, height), 8, 8)}>
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
        <Rect x={0} y={0} height={height} width={width}>
          <LinearGradient
            start={vec(0, height / 20)}
            end={vec(0, height / 3.3)}
            colors={['white', 'transparent']}
          />
        </Rect>
      }>
      {image && (
        <Image
          image={image}
          x={-175}
          y={-290}
          width={width * 1.9}
          height={height * 0.9}
          fit="contain"
        />
      )}
    </Mask>
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
          <TokenImageWithGradient />
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
        <Space y={24} />
        {descriptions.map(({ icon, text }, index) => (
          <View key={index}>
            <Row>
              {icon}
              <Text
                variant="heading6"
                sx={{
                  paddingHorizontal: 16
                }}>
                {text}
              </Text>
            </Row>
            <Space y={16} />
          </View>
        ))}
        <Space y={52} />
        <Button type="primary" size="xlarge" onPress={onInstructionRead}>
          {buttonText}
        </Button>
      </View>
    </View>
  )
}
