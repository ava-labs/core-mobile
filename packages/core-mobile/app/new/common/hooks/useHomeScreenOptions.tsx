import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import { ConnectButton } from 'common/components/ConnectButton'
import React from 'react'
import { View } from '@avalabs/k2-alpine'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'

export function useHomeScreenOptions(): NativeStackNavigationOptions {
  // const insets = useSafeAreaInsets()

  const homeScreenOptions: NativeStackNavigationOptions = {
    // headerStyle: {
    //   height: insets.top + 50
    // },
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
