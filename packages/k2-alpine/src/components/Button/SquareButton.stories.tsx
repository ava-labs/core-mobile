import React from 'react'
import { ScrollView, View } from '../Primitives'
import { useTheme } from '../..'
import { SquareButton, SquareButtonIconType } from './SquareButton'

export default {
  title: 'SquareButton'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const BUTTONS: { title: string; icon: SquareButtonIconType }[] = [
    { title: 'Bridge', icon: 'bridge' },
    { title: 'Swap', icon: 'swap' },
    { title: 'Send', icon: 'send' },
    { title: 'Stake', icon: 'stake' },
    { title: 'Buy', icon: 'buy' }
  ]

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginTop: 0, gap: 10 }}>
        {BUTTONS.map((button, index) => (
          <SquareButton key={index} title={button.title} icon={button.icon} />
        ))}
      </View>
    </ScrollView>
  )
}
