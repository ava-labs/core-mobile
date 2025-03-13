import { Avatar, TouchableOpacity, View } from '@avalabs/k2-alpine'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'

export const AccountSettingBarButton = forwardRef<RNView>(
  ({ onPress }: { onPress?: () => void }, ref): JSX.Element => {
    return (
      <TouchableOpacity ref={ref} onPress={onPress}>
        <View>
          <Avatar
            backgroundColor="transparent"
            size={32}
            // todo: replace with actual avatar
            source={{
              uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
            }}
            hasBlur={false}
            hasLoading={false}
          />
        </View>
      </TouchableOpacity>
    )
  }
)
