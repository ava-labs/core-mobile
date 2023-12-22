import React, { FC } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform, Share as ShareApi } from 'react-native'
import { useTheme } from '@avalabs/k2-mobile'
import { useDispatch, useSelector } from 'react-redux'
import { addFavorite } from 'store/browser/slices/favorites'
import { useNavigation } from '@react-navigation/native'
import { BrowserScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { selectActiveHistory } from 'store/browser/slices/tabs'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share'
}

type TabViewNavigationProp = BrowserScreenProps<
  typeof AppNavigation.Browser.TabView
>['navigation']

interface Props {
  isFavorited?: boolean
}

export const DockMenu: FC<Props> = ({
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

  const favoriteIcon = isFavorited
    ? { ios: 'star.fill', android: 'star_fill_24px' }
    : { ios: 'star', android: 'star_24px' }

  const menuActionColor =
    Platform.OS === 'android' ? colors.$white : colors.$black

  const menuActions = [
    {
      id: MenuId.Favorite,
      title: 'Mark as Favorite',
      image: Platform.select({
        ios: favoriteIcon.ios,
        android: favoriteIcon.android
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    },
    {
      id: MenuId.History,
      title: 'View History',
      image: Platform.select({
        ios: 'clock.arrow.circlepath',
        android: 'history_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    },
    {
      id: MenuId.Share,
      title: 'Share',
      image: Platform.select({
        ios: 'square.and.arrow.up',
        android: 'share_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }
  ]

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case MenuId.Share:
            onShare()
            break
          case MenuId.History: {
            navigate(AppNavigation.Browser.History)
            break
          }
          case MenuId.Favorite: {
            dispatch(
              addFavorite({
                favicon: '', // get from current html metadta
                title: '', // get from current html metadta
                description: '', // get from current html metadta
                url: activeHistory?.url ?? ''
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
