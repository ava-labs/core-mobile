import { useTheme } from '@avalabs/k2-alpine'
import { MenuView } from '@react-native-menu/menu'
import React, { PropsWithChildren } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
enum MenuId {
  TypeOrPaste = 'typeOrPaste',
  ScanQrCode = 'scanQrCode'
}

export const ContactAddressMenu = ({
  onScanQrCode,
  onTypeOrPaste,
  children,
  style
}: {
  onTypeOrPaste: () => void
  onScanQrCode: () => void
  style?: StyleProp<ViewStyle>
} & PropsWithChildren): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()

  const menuActions = [
    {
      id: MenuId.TypeOrPaste,
      title: 'Type in or paste address',
      titleColor: colors.$textPrimary
    },
    {
      id: MenuId.ScanQrCode,
      title: 'Scan QR code',
      titleColor: colors.$textPrimary
    }
  ]

  return (
    <MenuView
      onPressAction={({ nativeEvent }) => {
        switch (nativeEvent.event) {
          case MenuId.TypeOrPaste:
            onTypeOrPaste()
            break
          case MenuId.ScanQrCode: {
            onScanQrCode()
            break
          }
        }
      }}
      style={style}
      actions={menuActions}
      themeVariant={isDark ? 'dark' : 'default'}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
