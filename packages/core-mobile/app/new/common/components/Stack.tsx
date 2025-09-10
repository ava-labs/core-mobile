import { ParamListBase, StackNavigationState } from '@react-navigation/native'
import {
  createNativeStackNavigator,
  NativeStackNavigationEventMap,
  NativeStackNavigationOptions
} from '@react-navigation/native-stack'
import { withLayoutContext } from 'expo-router'

const { Navigator } = createNativeStackNavigator()

export const Stack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator)
