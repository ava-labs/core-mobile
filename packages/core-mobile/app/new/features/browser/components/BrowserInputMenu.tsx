import { useTheme } from '@avalabs/k2-alpine'
import { MenuView } from '@react-native-menu/menu'
import { useNavigation } from '@react-navigation/native'
import { showSnackbar } from 'common/utils/toast'
import React, { ReactNode, useMemo } from 'react'
import { Platform, Share as ShareApi } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addFavorite, removeFavorite } from 'store/browser/slices/favorites'
import { addTab, selectActiveHistory } from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import { useBrowserContext } from '../BrowserContext'
import { isValidUrl } from '../utils'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share',
  NewTab = 'newTab'
}

export const BrowserInputMenu = ({
  children,
  isFavorited = false
}: {
  isFavorited?: boolean
  children: ReactNode
}): JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation()
  const { handleClearAndFocus } = useBrowserContext()
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

    const menuActionColor = theme.colors.$textPrimary

    const historyAction = {
      id: MenuId.History,
      title: 'Browsing history',
      image: Platform.select({
        ios: 'clock.arrow.circlepath',
        android: 'history_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }

    const favoriteAction = {
      id: MenuId.Favorite,
      title: isFavorited ? 'Remove from favorites' : 'Mark as favorite',
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
      title: 'Open new tab',
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
  }, [activeHistory, isFavorited, theme.colors.$textPrimary])

  function handleNewTab(): void {
    // browser will listen to this and reset the screen with
    // initiated tab data
    AnalyticsService.capture('BrowserNewTabTapped')
    handleClearAndFocus()
    dispatch(addTab())
  }

  function handleShare(): void {
    AnalyticsService.capture('BrowserShareTapped')
    onShare()
  }

  function handleHistory(): void {
    AnalyticsService.capture('BrowserViewHistoryTapped')
    navigate('history')
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

      showSnackbar('Removed from Favorites')
    } else {
      dispatch(
        addFavorite({
          favicon: activeHistory.favicon,
          title: activeHistory.title,
          description: activeHistory.description ?? '',
          url: activeHistory.url
        })
      )
      showSnackbar('Added to Favorites')
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
      themeVariant={theme.isDark ? 'dark' : 'light'}
      actions={menuActions}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
