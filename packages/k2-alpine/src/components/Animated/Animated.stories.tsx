import React, { useEffect, useState } from 'react'
import { ScrollView, Text } from '../Primitives'
import { AnimatedText } from './AnimatedText'

export default {
  title: 'Animated'
}

export const All = (): JSX.Element => {
  const [characters, setCharacters] = useState(107.25)

  useEffect(() => {
    const interval = setInterval(() => {
      setCharacters(prev => parseFloat((prev + 0.22).toFixed(2)))
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
      <Text variant="heading6">Animated Text</Text>
      <AnimatedText characters={`$${characters}`} />
    </ScrollView>
  )
}
