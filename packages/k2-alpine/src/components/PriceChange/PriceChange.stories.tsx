import React, { useEffect, useState } from 'react'
import { ScrollView, Text, View } from '../Primitives'
import { PriceChange } from './PriceChange'

export default {
  title: 'PriceChange'
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
      <Text variant="heading6">Price Change</Text>
      <PriceChange formattedPrice={`$${characters}`} />
    </ScrollView>
  )
}
