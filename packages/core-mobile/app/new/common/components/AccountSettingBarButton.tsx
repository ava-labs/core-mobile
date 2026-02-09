import { Avatar, TouchableOpacity, View } from '@avalabs/k2-alpine'
import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NavigationBarButton from './NavigationBarButton'

export const AccountSettingBarButton = forwardRef<RNView>(
  (props, ref): JSX.Element => {
    const isDeveloperMode = useSelector(selectIsDeveloperMode)
    const { avatar } = useAvatar()
    const { navigate } = useRouter()

    const handlePress = (): void => {
      // @ts-ignore
      navigate('/accountSettings/')
    }

    return (
      <NavigationBarButton
        ref={ref}
        accessibilityLabel="account_setting_bar_btn"
        testID="account_setting_bar_btn"
        onPress={handlePress}
        isLeft>
        <Avatar
          size={34}
          source={avatar.source}
          hasBlur={false}
          hasLoading={false}
          isDeveloperMode={isDeveloperMode}
        />
      </NavigationBarButton>
    )
  }
)
