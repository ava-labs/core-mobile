import React from 'react'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { CircularProgress } from './CircularProgress'

export default {
  title: 'CircularProgress'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const progresses = [0.01, 0.5, 0.9, 0.99, 1]

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        {progresses.map(progress => (
          <CircularProgressStory key={progress} progress={progress} />
        ))}
      </ScrollView>
    </View>
  )
}

const CircularProgressStory = ({
  progress
}: {
  progress: number
}): JSX.Element => {
  return (
    <View sx={{ alignItems: 'center', gap: 8 }}>
      <CircularProgress progress={progress} />
      <Text>{progress}</Text>
    </View>
  )
}
