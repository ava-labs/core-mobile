import React, { FC, useMemo } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform, Share as ShareApi } from 'react-native'
import { useTheme } from '@avalabs/k2-mobile'
import { useDispatch } from 'react-redux'
import { addFavorite } from 'store/browser/slices/favorites'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useAnalytics } from 'hooks/useAnalytics'
import Logger from 'utils/Logger'
import { History } from 'store/browser'
import { isValidUrl } from '../utils'

enum MenuId {
  Favorite = 'favorite',
  // eslint-disable-next-line @typescript-eslint/no-shadow
  History = 'history',
  Share = 'share'
}

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

interface Props {
  history?: History
  isFavorited?: boolean
}

export const DockMenu: FC<Props> = ({
  children,
  history,
  isFavorited = false
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useNavigation<TabViewNavigationProp>()
  const { capture } = useAnalytics()

  const onShare = async (): Promise<void> => {
    const linkToShare = history?.url
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

    const menuActionColor =
      Platform.OS === 'android' ? colors.$white : colors.$black

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
      title: 'Mark as Favorite',
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

    if (history) {
      return [favoriteAction, historyAction, shareAction]
    } else {
      return [historyAction]
    }
  }, [history, colors, isFavorited])

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case MenuId.Share:
            capture('BrowserShareTapped')
            onShare()
            break
          case MenuId.History: {
            capture('BrowserViewHistoryTapped')
            navigate(AppNavigation.Browser.History)
            break
          }
          case MenuId.Favorite: {
            capture('BrowserAddToFavoriteTapped')
            let favicon: string | undefined

            if (!isValidUrl(history?.url ?? '')) {
              Logger.error('Invalid URL')
              return
            }

            const historyUrl = new URL(history?.url ?? '')
            const historyDomain =
              historyUrl.protocol + '//' + historyUrl.hostname

            if (history?.favicon) {
              if (isValidUrl(history.favicon)) {
                favicon = history.favicon
              } else {
                favicon = historyDomain + history.favicon
              }
            }

            dispatch(
              addFavorite({
                favicon,
                title: history?.title ?? '',
                description: history?.description ?? '',
                url: history?.url ?? ''
              })
            )
            // show toast message
            break
          }
        }
      }}
      actions={menuActions}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
