import { withLayoutContext } from 'expo-router'
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
  NativeBottomTabNavigationEventMap
} from '@bottom-tabs/react-navigation'
import { TabNavigationState } from 'expo-router'
import { ParamListBase } from 'expo-router/react-navigation'

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator

export const BottomTabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(BottomTabNavigator)
