import { Avatar, TouchableOpacity, View } from '@avalabs/k2-alpine'
import { useAvatar } from 'common/hooks/useAvatar'
import { useRouter } from 'expo-router'
import React, { forwardRef } from 'react'
import { View as RNView } from 'react-native'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

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
      <TouchableOpacity
        testID="account_setting_bar_btn"
        ref={ref}
        onPress={handlePress}
        style={{
          paddingRight: 8,
          height: '100%'
        }}>
        <View
          sx={{
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Avatar
            size={34}
            source={avatar.source}
            hasBlur={false}
            hasLoading={false}
            isDeveloperMode={isDeveloperMode}
          />
        </View>
      </TouchableOpacity>
    )
  }
)
