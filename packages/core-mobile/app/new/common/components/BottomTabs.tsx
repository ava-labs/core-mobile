import { withLayoutContext } from 'expo-router'
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
  NativeBottomTabNavigationEventMap
} from '@bottom-tabs/react-navigation'
import { ParamListBase, TabNavigationState } from '@react-navigation/native'

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator

export const BottomTabs = withLayoutContext<
  NativeBottomTabNavigationOptions,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabNavigationEventMap
>(BottomTabNavigator)
