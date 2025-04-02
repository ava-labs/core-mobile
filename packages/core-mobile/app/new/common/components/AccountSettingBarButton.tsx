import { Avatar, TouchableOpacity } from '@avalabs/k2-alpine'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const AccountSettingBarButton = forwardRef<RNView>(
  ({ onPress }: { onPress?: () => void }, ref): JSX.Element => {
    const isDeveloperMode = useSelector(selectIsDeveloperMode)

    return (
      <TouchableOpacity
        testID="account_setting_bar_btn"
        ref={ref}
        onPress={onPress}>
        <Avatar
          backgroundColor="transparent"
          size={32}
          // todo: replace with actual avatar
          source={{
            uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
          }}
          hasBlur={false}
          hasLoading={false}
          isDeveloperMode={isDeveloperMode}
        />
      </TouchableOpacity>
    )
  }
)
