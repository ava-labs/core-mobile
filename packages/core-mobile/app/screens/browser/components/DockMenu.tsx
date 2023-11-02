import React, { FC } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform, Share as ShareApi } from 'react-native'
import { useTheme } from '@avalabs/k2-mobile'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share'
}

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

  const onShare = async (): Promise<void> => {
    await ShareApi.share({
      message: 'check it out!',
      url: '' // get the history from the store
    })
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
            // should navigate to history screen
            break
          }
          case MenuId.Favorite: {
            // add to favorites
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
