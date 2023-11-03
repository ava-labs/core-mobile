import React from 'react'
import CarrotSVG from 'components/svg/CarrotSVG'
import CreateNewWalletPlusSVG, {
  IconWeight
} from 'components/svg/CreateNewWalletPlusSVG'
import EllipsisSVG from 'components/svg/EllipsisSVG'
import { TouchableOpacity, useTheme } from '@avalabs/k2-mobile'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import {
  addTab,
  goBackward,
  goForward as goFowardInPage,
  selectActiveTab,
  selectAllTabs,
  selectCanGoBack,
  selectCanGoForward
} from 'store/browser/slices/tabs'
import { BlurBackground } from 'components/BlurBackground'
import { useHardwareBackHandler } from '../handleBrowserBack'
import { DockMenu } from './DockMenu'
import { TabIcon } from './TabIcon'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const Dock = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate, replace } = useNavigation<TabViewNavigationProp>()
  const totalTabs = useSelector(selectAllTabs).length
  const activeTab = useSelector(selectActiveTab)
  useHardwareBackHandler()

  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)

  const isFavorited = useSelector(selectIsFavorited(activeTab?.activeHistoryId))

  const goBack = () => {
    if (!canGoBack) return
    dispatch(goBackward())
    navigate(AppNavigation.Browser.TabView)
  }
  const goForward = () => {
    if (!canGoForward) return
    dispatch(goFowardInPage())
    navigate(AppNavigation.Browser.TabView)
  }

  const createNewTab = () => {
    // browser will listen to this and reset the screen with
    // initiated tab data
    dispatch(addTab())
    replace(AppNavigation.Browser.TabView)
  }

  const navigateToTabList = () => {
    navigate(AppNavigation.Browser.TabsList)
  }

  return (
    <Animated.View
      style={{
        height: 64,
        left: 43.5,
        right: 43.5,
        borderRadius: 41,
        justifyContent: 'space-around',
        alignItems: 'center',
        flexDirection: 'row',
        bottom: 16,
        position: 'absolute',
        zIndex: 1
      }}
      entering={FadeInDown}
      exiting={FadeOutDown}>
      <BlurBackground
        opacity={0.44}
        iosBlurType="light"
        borderRadius={32}
        backgroundColor="#BFBFBF70"
      />
      <TouchableOpacity onPress={goBack} disabled={!canGoBack}>
        <CarrotSVG
          direction="left"
          size={26}
          color={canGoBack ? colors.$neutral900 : colors.$neutral300}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={goForward} disabled={!canGoForward}>
        <CarrotSVG
          size={26}
          color={canGoForward ? colors.$neutral900 : colors.$neutral300}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={createNewTab}>
        <CreateNewWalletPlusSVG
          size={21}
          weight={IconWeight.extraBold}
          color={colors.$neutral900}
        />
      </TouchableOpacity>
      <TabIcon numberOfTabs={totalTabs} onPress={navigateToTabList} />
      <DockMenu isFavorited={isFavorited}>
        <EllipsisSVG color={colors.$neutral900} size={25} />
      </DockMenu>
    </Animated.View>
  )
}
