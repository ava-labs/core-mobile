import React, { useRef } from 'react'
import { ConfettiMethods } from 'react-native-fast-confetti'
import { useTheme } from '../../hooks'
import { ScrollView, View } from '../Primitives'
import { Button } from '../Button/Button'
import { Confetti } from './Confetti'

export default {
  title: 'Confetti'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const ref = useRef<ConfettiMethods>(null)

  const handleRestart = (): void => {
    ref.current?.restart()
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={{
          padding: 16,
          gap: 16
        }}>
        <Button type="primary" size="small" onPress={handleRestart}>
          Restart
        </Button>
      </ScrollView>
      <Confetti ref={ref} />
    </View>
  )
}
