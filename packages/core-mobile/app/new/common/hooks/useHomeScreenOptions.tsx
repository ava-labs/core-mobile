import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import { StackNavigationOptions } from '@react-navigation/stack'
import { ReceiveBarButton } from 'common/components/ReceiveBarButton'
import React from 'react'
import { View } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useHomeScreenOptions(): StackNavigationOptions {
  const insets = useSafeAreaInsets()

  const homeScreenOptions: StackNavigationOptions = {
    headerStyle: {
      height: insets.top + 44
    },
    headerLeft: () => <AccountSettingBarButton />,
    headerRight: () => {
      return (
        <View
          sx={{
            flexDirection: 'row',
            gap: 12,
            height: '100%',
            alignItems: 'center'
          }}>
          <ReceiveBarButton />
          {/* <Link href="/notifications/" asChild>
              <NotificationBarButton />
            </Link> */}
        </View>
      )
    }
  }

  return homeScreenOptions
}
