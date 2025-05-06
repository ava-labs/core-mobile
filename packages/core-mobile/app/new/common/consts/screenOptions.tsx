import { View } from '@avalabs/k2-alpine'
import {
  StackCardInterpolatedStyle,
  StackNavigationOptions,
  TransitionPresets
} from '@react-navigation/stack'
import BackBarButton from 'common/components/BackBarButton'
import { ReceiveBarButton } from 'common/components/ReceiveBarButton'
import React from 'react'
import { Platform } from 'react-native'
//import { NotificationBarButton } from 'common/components/NotificationBarButton'
import { AccountSettingBarButton } from 'common/components/AccountSettingBarButton'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'

export const MODAL_TOP_MARGIN = Platform.OS === 'ios' ? 24 : 35
export const MODAL_BORDER_RADIUS = 40
export const MODAL_HEADER_HEIGHT = 62
export const BAR_BUTTONS_BOTTOM_MARGIN = Platform.OS === 'ios' ? 8 : 0

export const commonNavigatorScreenOptions: StackNavigationOptions = {
  title: '',
  headerBackButtonDisplayMode: 'minimal',
  headerShadowVisible: false,
  headerTitleAlign: 'center',
  headerBackImage: () => <BackBarButton />,
  ...TransitionPresets.SlideFromRightIOS
}

export const stackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerTransparent: true
}

export const modalStackNavigatorScreenOptions: StackNavigationOptions = {
  ...commonNavigatorScreenOptions,
  headerBackground: () => <BlurredBackgroundView hasGrabber={true} />,
  headerBackImage: () => <BackBarButton isModal />,
  headerTransparent: true,
  headerStyle: {
    height: MODAL_HEADER_HEIGHT
  },
  // on iOS,we need to set headerStatusBarHeight to 0 to
  // prevent the header from jumping when navigating
  ...(Platform.OS === 'ios' && { headerStatusBarHeight: 0 })
}

export const modalScreenOptionsWithHeaderBack: StackNavigationOptions = {
  headerBackImage: () => <BackBarButton isModal />
}

export const homeScreenOptions: StackNavigationOptions = {
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
        {/* @ts-ignore */}
        <ReceiveBarButton />
        {/* <Link href="/notifications/" asChild>
          <NotificationBarButton />
        </Link> */}
      </View>
    )
  }
}

export function forNoAnimation(): StackCardInterpolatedStyle {
  return {}
}
