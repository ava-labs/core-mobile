import React, { useState } from 'react'
import { Button } from '../Button/Button'
import { ScrollView, Text, View } from '../Primitives'
import { LoadingContent } from './LoadingContent'

export default {
  title: 'LoadingContent'
}

export const All = (): JSX.Element => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <ScrollView
      sx={{
        width: '100%'
      }}
      contentContainerStyle={{
        padding: 16,
        paddingHorizontal: 16,
        gap: 32
      }}>
      <View sx={{ gap: 16 }}>
        <Text variant="heading3">Loading State</Text>
        <LoadingContent isLoading={true}>
          <Text
            style={{
              fontSize: 24,
              lineHeight: 24,
              fontFamily: 'Aeonik-Medium'
            }}>
            Loading...
          </Text>
        </LoadingContent>
      </View>

      <View sx={{ gap: 16 }}>
        <Text variant="heading3">Not Loading State</Text>
        <LoadingContent isLoading={false}>
          <Text
            style={{
              fontSize: 24,
              lineHeight: 24,
              fontFamily: 'Aeonik-Medium'
            }}>
            Loading...
          </Text>
        </LoadingContent>
      </View>

      <View sx={{ gap: 16, alignItems: 'flex-start' }}>
        <View
          sx={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <Text variant="heading3">Interactive Example</Text>
          <Button
            onPress={() => setIsLoading(!isLoading)}
            type="primary"
            size="small">
            {isLoading ? 'Stop' : 'Start'}
          </Button>
        </View>

        <LoadingContent isLoading={isLoading}>
          <Text
            style={{
              fontSize: 24,
              lineHeight: 24,
              fontFamily: 'Aeonik-Medium'
            }}>
            Loading...
          </Text>
        </LoadingContent>
      </View>
    </ScrollView>
  )
}
