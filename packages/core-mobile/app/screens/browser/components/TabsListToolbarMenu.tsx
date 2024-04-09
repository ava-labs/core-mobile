import React, { FC, PropsWithChildren } from 'react'
import { MenuView } from '@react-native-menu/menu'
import { Platform } from 'react-native'
import { useTheme } from '@avalabs/k2-mobile'

enum MenuId {
  CloseAll = 'closeAll',
  ViewHistory = 'history'
}

interface Props {
  onCloseAll: () => void
  onViewHistory: () => void
}

const TabsListToolbarMenu: FC<Props & PropsWithChildren> = ({
  onCloseAll,
  onViewHistory,
  children
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const menuActionColor = colors.$white

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
      themeVariant="dark"
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}

export default TabsListToolbarMenu
