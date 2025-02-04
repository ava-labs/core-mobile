import { Avatar, TouchableOpacity, View } from '@avalabs/k2-alpine'
import React from 'react'

export const AccountSettingBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View sx={{ marginTop: 5 }}>
        <Avatar
          backgroundColor="transparent"
          size={36}
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
