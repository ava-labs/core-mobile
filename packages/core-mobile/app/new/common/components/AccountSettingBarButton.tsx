import { Avatar, TouchableOpacity } from '@avalabs/k2-alpine'
import { useAvatar } from 'common/hooks/useAvatar'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const AccountSettingBarButton = forwardRef<RNView>(
  ({ onPress }: { onPress?: () => void }, ref): JSX.Element => {
    const isDeveloperMode = useSelector(selectIsDeveloperMode)
    const { avatar } = useAvatar()

    return (
      <TouchableOpacity
        testID="account_setting_bar_btn"
        ref={ref}
        onPress={onPress}>
        <Avatar
          size={32}
          source={avatar.source}
          hasBlur={false}
          hasLoading={false}
          isDeveloperMode={isDeveloperMode}
        />
      </TouchableOpacity>
    )
  }
)
