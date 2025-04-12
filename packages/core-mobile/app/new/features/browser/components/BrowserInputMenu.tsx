import { Icons, useTheme } from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { DropdownItem, DropdownMenu } from 'common/components/DropdownMenu'
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
import { useBrowserContext } from '../BrowserContext'
import { isValidUrl } from '../utils'

import BackImage from '../../../assets/icons/menu/arrow_back_ios.png'
import ForwardImage from '../../../assets/icons/menu/arrow_forward_ios.png'
import RefreshImage from '../../../assets/icons/menu/refresh.png'
import ShareImage from '../../../assets/icons/menu/ios_share.png'
import FavoriteOnImage from '../../../assets/icons/menu/favorite_off.png'
import FavoriteOffImage from '../../../assets/icons/menu/favorite_on.png'
import HistoryImage from '../../../assets/icons/menu/history.png'
import AddImage from '../../../assets/icons/menu/add.png'
import BackImageDisabled from '../../../assets/icons/menu/arrow_back_ios_disabled.png'
import ForwardImageDisabled from '../../../assets/icons/menu/arrow_forward_ios_disabled.png'
import RefreshImageDisabled from '../../../assets/icons/menu/refresh_disabled.png'

import BackImageLight from '../../../assets/icons/menu/arrow_back_ios_light.png'
import ForwardImageLight from '../../../assets/icons/menu/arrow_forward_ios_light.png'
import RefreshImageLight from '../../../assets/icons/menu/refresh_light.png'
import ShareImageLight from '../../../assets/icons/menu/ios_share_light.png'
import FavoriteOnImageLight from '../../../assets/icons/menu/favorite_on_light.png'
import FavoriteOffImageLight from '../../../assets/icons/menu/favorite_off_light.png'
import HistoryImageLight from '../../../assets/icons/menu/history_light.png'
import AddImageLight from '../../../assets/icons/menu/add_light.png'
import BackImageDisabledLight from '../../../assets/icons/menu/arrow_back_ios_light_disabled.png'
import ForwardImageDisabledLight from '../../../assets/icons/menu/arrow_forward_ios_light_disabled.png'
import RefreshImageDisabledLight from '../../../assets/icons/menu/refresh_light_disabled.png'

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
  const { navigate } = useNavigation()
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
        icon: {
          android: 'arrow_back_24px'
        },
        image: theme.isDark
          ? isBackDisabled
            ? BackImageDisabledLight
            : BackImageLight
          : isBackDisabled
          ? BackImageDisabled
          : BackImage,
        disabled: isBackDisabled
      },
      {
        id: NavigationId.Forward,
        title: 'Forward',
        icon: {
          android: 'arrow_forward_24px'
        },
        image: theme.isDark
          ? isForwardDisabled
            ? ForwardImageDisabledLight
            : ForwardImageLight
          : isForwardDisabled
          ? ForwardImageDisabled
          : ForwardImage,
        disabled: isForwardDisabled
      },
      {
        id: NavigationId.Refresh,
        title: 'Refresh',
        icon: {
          android: 'refresh_24px'
        },
        image: theme.isDark
          ? isRefreshDisabled
            ? RefreshImageDisabledLight
            : RefreshImageLight
          : isRefreshDisabled
          ? RefreshImageDisabled
          : RefreshImage,
        disabled: isRefreshDisabled
      }
    ]
  }, [
    activeTab?.activeHistoryIndex,
    activeTab?.historyIds?.length,
    theme.isDark
  ])

  const menuActions: DropdownItem[] = useMemo(() => {
    const historyAction = {
      id: MenuId.History,
      title: 'Browsing history',
      icon: {
        android: 'history_24px'
      },
      image: theme.isDark ? HistoryImageLight : HistoryImage
    }

    const favoriteAction = {
      id: MenuId.Favorite,
      title: isFavorited ? 'Remove from favorites' : 'Mark as favorite',
      icon: {
        android: isFavorited ? 'star_fill_24px' : 'star_24px'
      },
      image: isFavorited
        ? theme.isDark
          ? FavoriteOnImageLight
          : FavoriteOnImage
        : theme.isDark
        ? FavoriteOffImageLight
        : FavoriteOffImage
    }

    const shareAction = {
      id: MenuId.Share,
      title: 'Share',
      icon: {
        android: 'share_24px'
      },
      image: theme.isDark ? ShareImageLight : ShareImage
    }

    const newTabAction = {
      id: MenuId.NewTab,
      title: 'Open new tab',
      icon: {
        android: 'plus_24px'
      },
      image: theme.isDark ? AddImageLight : AddImage
    }

    if (activeHistory) {
      return [newTabAction, favoriteAction, historyAction, shareAction]
    } else {
      return [historyAction, newTabAction]
    }
  }, [activeHistory, isFavorited, theme.isDark])

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
    navigate('history')
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
