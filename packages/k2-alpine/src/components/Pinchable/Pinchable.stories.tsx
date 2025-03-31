import { Image } from 'expo-image'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Text, View } from '../Primitives'
import { Pinchable } from './Pinchable'

export default {
  title: 'Pinchable'
}

export const All = (): JSX.Element => {
  return (
    <GestureHandlerRootView>
      <View
        sx={{
          padding: 16,
          gap: 16,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <View
          style={{
            gap: 16,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Text variant="heading6">Pinchable</Text>
          <Pinchable>
            <Image
              source={
                'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
              }
              style={{ width: 300, height: 300 }}
            />
          </Pinchable>
        </View>
      </View>
    </GestureHandlerRootView>
  )
}
