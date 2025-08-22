import { Icons, useTheme } from '@avalabs/k2-alpine'
import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
import { DropdownMenuIcon } from 'common/components/DropdownMenuIcons'
import { showSnackbar } from 'common/utils/toast'
import React, { useCallback, useMemo } from 'react'
import { Platform, Share as ShareApi, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { addFavorite, removeFavorite } from 'store/browser/slices/favorites'
import {
  addTab,
  selectActiveHistory,
  selectActiveTab
} from 'store/browser/slices/tabs'
import Logger from 'utils/Logger'
import { useRouter } from 'expo-router'
import { useBrowserContext } from '../BrowserContext'
import { isValidUrl } from '../utils'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share',
  NewTab = 'newTab'
}

enum NavigationId {
  Refresh = 'refresh',
  Back = 'back',
  Forward = 'forward'
}

export const BrowserInputMenu = ({
  isFavorited = false
}: {
  isFavorited?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const { handleClearAndFocus, browserRefs } = useBrowserContext()
  const activeHistory = useSelector(selectActiveHistory)
  const activeTab = useSelector(selectActiveTab)

  const navigationsActions: DropdownItem[] = useMemo(() => {
    const isBackDisabled = activeTab?.activeHistoryIndex === -1
    const isForwardDisabled =
      activeTab?.activeHistoryIndex === (activeTab?.historyIds?.length ?? 0) - 1
    const isRefreshDisabled = activeTab?.activeHistoryIndex === -1

    return [
      {
        id: NavigationId.Back,
        title: 'Back',
        disabled: isBackDisabled,
        icon: DropdownMenuIcon.ArrowBack
      },
      {
        id: NavigationId.Forward,
        title: 'Forward',
        disabled: isForwardDisabled,
        icon: DropdownMenuIcon.ArrowForward
      },
      {
        id: NavigationId.Refresh,
        title: 'Refresh',
        disabled: isRefreshDisabled,
        icon: DropdownMenuIcon.Refresh
      }
    ]
  }, [activeTab?.activeHistoryIndex, activeTab?.historyIds?.length])

  const menuActions: DropdownItem[] = useMemo(() => {
    const historyAction = {
      id: MenuId.History,
      title: 'Browsing history',
      icon: DropdownMenuIcon.History
    }

    const favoriteAction = {
      id: MenuId.Favorite,
      title: isFavorited ? 'Remove from favorites' : 'Mark as favorite',
      icon: isFavorited
        ? DropdownMenuIcon.FavoriteOn
        : DropdownMenuIcon.FavoriteOff
    }

    const shareAction = {
      id: MenuId.Share,
      title: 'Share',
      icon: DropdownMenuIcon.Share
    }

    const newTabAction = {
      id: MenuId.NewTab,
      title: 'Open new tab',
      icon: DropdownMenuIcon.Add
    }

    if (activeHistory) {
      return [newTabAction, favoriteAction, historyAction, shareAction]
    } else {
      return [historyAction, newTabAction]
    }
  }, [activeHistory, isFavorited])

  const onShare = useCallback(async (): Promise<void> => {
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
  }, [activeHistory])

  const handleNewTab = useCallback((): void => {
    AnalyticsService.capture('BrowserNewTabTapped')
    handleClearAndFocus()
    dispatch(addTab())
  }, [dispatch, handleClearAndFocus])

  const handleShare = useCallback((): void => {
    AnalyticsService.capture('BrowserShareTapped')
    onShare()
  }, [onShare])

  const handleHistory = useCallback((): void => {
    AnalyticsService.capture('BrowserViewHistoryTapped')
    // @ts-ignore TODO: make routes typesafe
    navigate('(modals)/browserHistory')
  }, [navigate])

  const handleFavorite = useCallback((): void => {
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
  }, [activeHistory, dispatch, isFavorited])

  const handleBack = useCallback((): void => {
    AnalyticsService.capture('BrowserBackTapped')
    if (activeTab?.id) {
      browserRefs.current[activeTab?.id]?.current?.goBack()
    }
  }, [activeTab?.id, browserRefs])

  const handleForward = useCallback((): void => {
    AnalyticsService.capture('BrowserForwardTapped')
    if (activeTab?.id) {
      browserRefs.current[activeTab?.id]?.current?.goForward()
    }
  }, [activeTab?.id, browserRefs])

  const handleRefresh = useCallback((): void => {
    AnalyticsService.capture('BrowserRefreshTapped')
    if (activeTab?.id) {
      browserRefs.current[activeTab?.id]?.current?.reload()
    }
  }, [activeTab?.id, browserRefs])

  const onPressAction = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
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
        case NavigationId.Back: {
          handleBack()
          break
        }
        case NavigationId.Forward: {
          handleForward()
          break
        }
        case NavigationId.Refresh: {
          handleRefresh()
          break
        }
      }
    },
    [
      handleBack,
      handleFavorite,
      handleForward,
      handleHistory,
      handleNewTab,
      handleRefresh,
      handleShare
    ]
  )

  const onOpenChange = useCallback((open: boolean) => {
    if (open) {
      AnalyticsService.capture('BrowserContextualMenuOpened')
    }
  }, [])

  const sections = useMemo(() => {
    if (Platform.OS === 'ios') {
      return [
        {
          key: 'menu-actions',
          items: menuActions.reverse()
        },
        {
          key: 'navigation-actions',
          items: navigationsActions,
          horizontal: true
        }
      ]
    }

    return [
      {
        key: 'navigation-actions',
        items: navigationsActions,
        horizontal: true
      },
      {
        key: 'menu-actions',
        items: menuActions
      }
    ]
  }, [menuActions, navigationsActions])

  return (
    <DropdownMenu
      onOpenChange={onOpenChange}
      onPressAction={onPressAction}
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      }}
      groups={sections}>
      <View>
        <Icons.Navigation.MoreHoriz color={theme.colors.$textPrimary} />
      </View>
    </DropdownMenu>
  )
}
