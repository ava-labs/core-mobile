import { useTheme } from '@avalabs/k2-alpine'
import { MenuView } from '@react-native-menu/menu'
import React, { PropsWithChildren } from 'react'

enum MenuId {
  TypeOrPaste = 'typeOrPaste',
  ScanQrCode = 'scanQrCode'
}

export const ContactAddressMenu = ({
  onScanQrCode,
  onTypeOrPaste,
  children
}: {
  onTypeOrPaste: () => void
  onScanQrCode: () => void
} & PropsWithChildren): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()

  const menuActions = [
    {
      id: MenuId.TypeOrPaste,
      title: 'Type in or paste address'
    },
    {
      id: MenuId.ScanQrCode,
      title: 'Scan QR code'
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
      actions={menuActions}
      themeVariant={isDark ? 'dark' : 'light'}
      shouldOpenOnLongPress={false}>
      {children}
    </MenuView>
  )
}
