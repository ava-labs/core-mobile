import React from 'react'
import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-mobile'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsFavorited } from 'store/browser/slices/favorites'
import AppNavigation from 'navigation/AppNavigation'
import { BrowserScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import {
  addTab,
  goBackward,
  goForward as goForwardInPage,
  selectAllTabs,
  selectCanGoBack,
  selectCanGoForward,
  selectTab
} from 'store/browser/slices/tabs'
import { BlurBackground } from 'components/BlurBackground'
import { useAnalytics } from 'hooks/useAnalytics'
import { TabId } from 'store/browser'
import { useHardwareBackHandler } from '../handleBrowserBack'
import { DockMenu } from './DockMenu'
import { TabIcon } from './TabIcon'

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

export const Dock = ({ tabId }: { tabId: TabId }): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation<TabViewNavigationProp>()
  const totalTabs = useSelector(selectAllTabs).length
  const activeHistory = useSelector(selectTab(tabId))?.activeHistory
  useHardwareBackHandler()
  const { capture } = useAnalytics()

  const canGoBack = useSelector(selectCanGoBack)
  const canGoForward = useSelector(selectCanGoForward)

  const isFavorited = useSelector(selectIsFavorited(activeHistory?.id))

  const goBack = (): void => {
    if (!canGoBack) return
    capture('BrowserBackTapped')
    dispatch(goBackward())
  }
  const goForward = (): void => {
    if (!canGoForward) return
    capture('BrowserForwardTapped')
    dispatch(goForwardInPage())
  }

  const createNewTab = (): void => {
    // browser will listen to this and reset the screen with
    // initiated tab data
    capture('BrowserNewTabTapped')
    dispatch(addTab())
  }

  const navigateToTabList = (): void => {
    capture('BrowserTabsOpened')
    navigate(AppNavigation.Modal.BrowserTabsList)
  }

  const ICON_SIZE = 32

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
        <Icons.Navigation.ArrowBackIOSNew
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={canGoBack ? colors.$neutral900 : colors.$neutral300}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={goForward} disabled={!canGoForward}>
        <Icons.Navigation.ArrowForwardIOS
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={canGoForward ? colors.$neutral900 : colors.$neutral300}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={createNewTab}>
        <Icons.Content.Add
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={colors.$neutral900}
        />
      </TouchableOpacity>
      <TabIcon numberOfTabs={totalTabs} onPress={navigateToTabList} />
      <TouchableOpacity onPress={() => capture('BrowserContextualMenuOpened')}>
        <DockMenu isFavorited={isFavorited} history={activeHistory}>
          <Icons.Navigation.MoreHoriz
            color={colors.$neutral900}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        </DockMenu>
      </TouchableOpacity>
    </Animated.View>
  )
}
