import {
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions,
  StackNavigationState,
  withLayoutContext
} from 'expo-router'
import { ParamListBase } from 'expo-router/react-navigation'
import { createNativeStackNavigator } from 'expo-router/build/react-navigation/native-stack'

const { Navigator } = createNativeStackNavigator()

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator)
