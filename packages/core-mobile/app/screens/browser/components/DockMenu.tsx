import React, { FC } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform, Share as ShareApi } from 'react-native'

enum MenuId {
  Favorite = 'favorite',
  History = 'history',
  Share = 'share'
}

export const DockMenu: FC = ({ children }): JSX.Element => {
  const onShare = async (): Promise<void> => {
    await ShareApi.share({
      message: 'check it out!',
      url: '' // get the history from the store
    })
  }

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

const menuActions = [
  {
    id: MenuId.Favorite,
    title: 'Mark as Favorite',
    image: Platform.select({
      ios: 'star',
      android: 'star'
    })
  },
  {
    id: MenuId.History,
    title: 'View History',
    image: Platform.select({
      ios: 'clock.arrow.circlepath',
      android: 'star'
    })
  },
  {
    id: MenuId.Share,
    title: 'Share',
    image: Platform.select({
      ios: 'square.and.arrow.up',
      android: 'star'
    })
  }
]
