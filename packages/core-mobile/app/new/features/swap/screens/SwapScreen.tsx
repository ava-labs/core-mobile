import React, { useCallback } from 'react'
import { Pressable, Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'

export const SwapScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handleSelectToken = useCallback((): void => {
    navigate({ pathname: '/selectToken' })
  }, [navigate])

  return (
    <View
      style={{
        flex: 1
      }}>
      <Text
        variant="heading2"
        style={{ marginBottom: 12, paddingLeft: 16, paddingRight: 64 }}>
        Swap
      </Text>
      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <Pressable
          onPress={handleSelectToken}
          sx={{
            backgroundColor: '$surfaceSecondary',
            paddingVertical: 13,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
          <Text
            variant="body2"
            style={{
              fontSize: 16,
              lineHeight: 22,
              color: '$textPrimary',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
            Select Token
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
