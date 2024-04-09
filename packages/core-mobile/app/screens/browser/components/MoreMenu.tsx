import React, { FC, PropsWithChildren, useMemo } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform, Share as ShareApi } from 'react-native'
import { useTheme } from '@avalabs/k2-mobile'
import { useDispatch, useSelector } from 'react-redux'
import { addFavorite, removeFavorite } from 'store/browser/slices/favorites'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { addTab, selectActiveHistory } from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import { showSimpleToast } from 'components/Snackbar'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isValidUrl } from '../utils'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share',
  NewTab = 'newTab'
}

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

interface Props {
  isFavorited?: boolean
}

export const MoreMenu: FC<Props & PropsWithChildren> = ({
  children,
  isFavorited = false
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation<TabViewNavigationProp>()
  const activeHistory = useSelector(selectActiveHistory)

  const onShare = async (): Promise<void> => {
    const linkToShare = activeHistory?.url
    if (linkToShare) {
      const content =
        Platform.OS === 'ios'
          ? {
              url: linkToShare
            }
          : {
              message: linkToShare
            }

      await ShareApi.share(content)
    }
  }

  const menuActions = useMemo(() => {
    const favoriteIcon = isFavorited
      ? { ios: 'star.fill', android: 'star_fill_24px' }
      : { ios: 'star', android: 'star_24px' }

    const menuActionColor = colors.$white

    const historyAction = {
      id: MenuId.History,
      title: 'View History',
      image: Platform.select({
        ios: 'clock.arrow.circlepath',
        android: 'history_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }

    const favoriteAction = {
      id: MenuId.Favorite,
      title: isFavorited ? 'Remove from Favorites' : 'Mark as Favorite',
      image: Platform.select({
        ios: favoriteIcon.ios,
        android: favoriteIcon.android
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }

    const shareAction = {
      id: MenuId.Share,
      title: 'Share',
      image: Platform.select({
        ios: 'square.and.arrow.up',
        android: 'share_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }

    const newTabAction = {
      id: MenuId.NewTab,
      title: 'New Tab',
      image: Platform.select({
        ios: 'plus',
        android: 'plus_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }

    if (activeHistory) {
      return [newTabAction, favoriteAction, historyAction, shareAction]
    } else {
      return [newTabAction, historyAction]
    }
  }, [activeHistory, colors, isFavorited])

  function handleNewTab(): void {
    // browser will listen to this and reset the screen with
    // initiated tab data
    AnalyticsService.capture('BrowserNewTabTapped')
    dispatch(addTab())
  }

  function handleShare(): void {
    AnalyticsService.capture('BrowserShareTapped')
    onShare()
  }

  function handleHistory(): void {
    AnalyticsService.capture('BrowserViewHistoryTapped')
    navigate(AppNavigation.Browser.History)
  }

  function handleFavorite(): void {
    if (!activeHistory) {
      return
    }

    AnalyticsService.capture('BrowserAddToFavoriteTapped')
    if (!isValidUrl(activeHistory.url ?? '')) {
      Logger.error('Invalid URL')
      return
    }

    if (isFavorited) {
      dispatch(removeFavorite({ url: activeHistory.url }))

      showSimpleToast('Removed from Favorites')
    } else {
      const activeHistoryUrl = new URL(activeHistory.url)
      const activeHistoryDomain =
        activeHistoryUrl.protocol + '//' + activeHistoryUrl.hostname

      let favicon: string | undefined
      if (activeHistory.favicon) {
        if (isValidUrl(activeHistory.favicon)) {
          favicon = activeHistory.favicon
        } else {
          favicon = activeHistoryDomain + activeHistory.favicon
        }
      }

      dispatch(
        addFavorite({
          favicon,
          title: activeHistory.title,
          description: activeHistory.description ?? '',
          url: activeHistory.url
        })
      )

      showSimpleToast('Added to Favorites')
    }
  }

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case MenuId.Share:
            handleShare()
            break
          case MenuId.History: {
            handleHistory()
            break
          }
          case MenuId.Favorite: {
            handleFavorite()
            break
          }
          case MenuId.NewTab: {
            handleNewTab()
            break
          }
        }
      }}
      themeVariant="dark"
      actions={menuActions}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
