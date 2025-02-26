import React, { useEffect, useState } from 'react'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { showAlert } from '../Alert/Alert'
import { ScrollView, Text, View } from '../Primitives'
import { AnimatedPressable } from './AnimatedPressable'
import { AnimatedText } from './AnimatedText'

export default {
  title: 'Animated'
}

export const All = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [characters, setCharacters] = useState(107.25)

  useEffect(() => {
    const interval = setInterval(() => {
      setCharacters(prev => parseFloat((prev + 0.23).toFixed(2)))
    }, 2000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <ScrollView
      sx={{
        width: '100%'
      }}
      contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
      <View
        style={{
          gap: 16
        }}>
        <Text variant="heading6">Animated Text</Text>
        <AnimatedText characters={`$${characters}`} />
      </View>
      <View
        style={{
          gap: 16,
          alignItems: 'center'
        }}>
        <Text variant="heading6">Animated Pressable</Text>
        <AnimatedPressable
          onPress={() =>
            showAlert({
              title: 'Pressed',
              buttons: [
                {
                  text: 'OK'
                }
              ]
            })
          }>
          <View
            sx={{
              width: 100,
              height: 100,
              backgroundColor: alpha(colors.$textPrimary, 0.1),
              borderRadius: 18
            }}
          />
        </AnimatedPressable>
      </View>
    </ScrollView>
  )
}
