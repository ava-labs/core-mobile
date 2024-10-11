import {
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack'
import React from 'react'
import Grabber from '@/components/navigation/Grabber'

export const modalStackNavigatorScreenOptions: NativeStackNavigationOptions = {
  title: '',
  headerBackTitleVisible: false,
  headerTitle: () => <Grabber />,
  headerShadowVisible: false,
  headerTitleAlign: 'center',
}

export const modalScreensOptions: NativeStackNavigationOptions = {
  presentation: 'modal',
  // cardStyle: {
  //   borderTopLeftRadius: 40,
  //   borderTopRightRadius: 40,
  //   marginTop: 75
  // },
  gestureEnabled: true,
  gestureDirection: 'vertical',
  // cardStyleInterpolator: forModalPresentationIOS
}
