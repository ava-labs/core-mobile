import React, { FC, PropsWithChildren } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform } from 'react-native'
import { useTheme } from '@avalabs/k2-alpine'

enum MenuId {
  CloseAll = 'closeAll',
  ViewHistory = 'history'
}

interface Props {
  onCloseAll: () => void
  onViewHistory: () => void
}

export const TabsToolbarMenu: FC<Props & PropsWithChildren> = ({
  onCloseAll,
  onViewHistory,
  children
}): JSX.Element => {
  const { theme } = useTheme()
  const menuActionColor = theme.colors.$white

  const menuActions = [
    {
      id: MenuId.CloseAll,
      title: 'Close All Tabs',
      image: Platform.select({
        ios: 'xmark',
        android: 'xmark_24px'
      }),
      attributes: {
        destructive: true
      }
    },
    {
      id: MenuId.ViewHistory,
      title: 'View History',
      image: Platform.select({
        ios: 'clock.arrow.circlepath',
        android: 'history_24px'
      }),
      titleColor: menuActionColor,
      imageColor: menuActionColor
    }
  ]

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case MenuId.CloseAll:
            onCloseAll()
            break
          case MenuId.ViewHistory: {
            onViewHistory()
            break
          }
        }
      }}
      actions={menuActions}
      themeVariant={theme.isDark ? 'dark' : 'light'}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
