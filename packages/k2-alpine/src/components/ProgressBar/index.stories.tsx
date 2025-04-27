import React, { useEffect } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { ScrollView, Text, View } from '../Primitives'
import { MaskedProgressBar } from './MaskedProgressBar'
import { ProgressBar } from './ProgressBar'

export default {
  title: 'ProgressBar'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const progress = useSharedValue(0)

  useEffect(() => {
    const interval = setInterval(() => {
      progress.value = Math.min(progress.value + 0.1, 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [progress])

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{
          padding: 16,
          gap: 16,
          alignItems: 'center'
        }}>
        <View>
          <Text variant="heading6">Toggle Off Disabled</Text>
          <View style={{ height: 40 }}>
            <ProgressBar progress={progress} />
          </View>
        </View>

        <View>
          <Text variant="heading6">Toggle Off Disabled</Text>
          <View style={{ height: 40 }}>
            <MaskedProgressBar progress={progress}>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12
                }}>
                <Text>Text</Text>
                <Icons.Action.Clear />
              </View>
            </MaskedProgressBar>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
