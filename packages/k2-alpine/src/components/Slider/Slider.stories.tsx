import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { Slider } from './Slider'

export default {
  title: 'Slider'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <GestureHandlerRootView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{
          padding: 16,
          gap: 32,
          alignItems: 'center'
        }}>
        <SliderStory />
        <SliderStory
          minimumValue={0.01}
          maximumValue={0.99}
          minimumValueLabel="1%"
          maximumValueLabel="99%"
        />
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const SliderStory = ({
  minimumValue,
  maximumValue,
  minimumValueLabel,
  maximumValueLabel
}: {
  minimumValue?: number
  maximumValue?: number
  minimumValueLabel?: string
  maximumValueLabel?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const value = useSharedValue(0.5)
  const minValue = useSharedValue(minimumValue ?? 0)
  const maxValue = useSharedValue(maximumValue ?? 1)
  const [text, setText] = React.useState(value.value.toFixed(2))

  useAnimatedReaction(
    () => value.value,
    newValue => {
      runOnJS(setText)(newValue.toFixed(2))
    },
    [value]
  )

  return (
    <View style={{ width: '100%', gap: 20 }}>
      <Text variant="heading6" sx={{ alignSelf: 'center' }}>
        Slide Value: {text}
      </Text>
      <Slider
        thumbBorderColor={theme.colors.$surfacePrimary}
        value={value}
        minimumValue={minValue}
        maximumValue={maxValue}
        minimumValueLabel={minimumValueLabel}
        maximumValueLabel={maximumValueLabel}
      />
    </View>
  )
}
