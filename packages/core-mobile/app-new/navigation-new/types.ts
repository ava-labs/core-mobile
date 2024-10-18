import { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { CompositeScreenProps } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import { MainTabParamList } from './signedIn/mainTab/MainTab'
import { PortfolioStackParamList } from './signedIn/mainTab/stacks/PortfolioStack'
import { SignedInStackParamList } from './signedIn/SignedInStack'
import { SettingsStackParamList } from './signedIn/settings/SettingsStack'

export type SignedInStackProps = StackScreenProps<SignedInStackParamList>

export type MainTabsScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    StackScreenProps<SignedInStackParamList, 'MainTab'>
  >

export type PortfolioStackProps<T extends keyof PortfolioStackParamList> =
  CompositeScreenProps<
    StackScreenProps<PortfolioStackParamList, T>,
    MainTabsScreenProps<keyof MainTabParamList>
  >

export type SettingsStackProps<T extends keyof SettingsStackParamList> =
  CompositeScreenProps<
    StackScreenProps<SettingsStackParamList, T>,
    MainTabsScreenProps<keyof MainTabParamList>
  >
