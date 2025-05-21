import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import { StackNavigationOptions } from '@react-navigation/stack'
import { ConnectButton } from 'common/components/ConnectButton'
import React from 'react'
import { View } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useHomeScreenOptions(): StackNavigationOptions {
  const insets = useSafeAreaInsets()

  const homeScreenOptions: StackNavigationOptions = {
    headerStyle: {
      height: insets.top + 50
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
          <ConnectButton />
          {/* <Link href="/notifications/" asChild>
              <NotificationBarButton />
            </Link> */}
        </View>
      )
    }
  }

  return homeScreenOptions
}
