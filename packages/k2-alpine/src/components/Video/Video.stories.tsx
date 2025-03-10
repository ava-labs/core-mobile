import React from 'react'
import { useTheme } from '../../hooks'
import { ScrollView, Text, View } from '../Primitives'
import { Video } from './Video'

export default {
  title: 'Video'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

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
        <Text variant="heading6">Video</Text>
        <View>
          <Video
            source="https://www.w3schools.com/html/mov_bbb.mp4"
            style={{
              width: 200,
              height: 200
            }}
            autoPlay
            muted
            onLoadEnd={(): void => {
              return
            }}
            onError={(): void => {
              return
            }}
          />
        </View>
      </ScrollView>
    </View>
  )
}
