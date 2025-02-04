import { Icons, TouchableOpacity, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const ReceiveBarButton = ({
  onPress
}: {
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity onPress={onPress}>
      <Icons.Communication.QRCode2 color={theme.colors.$textPrimary} />
    </TouchableOpacity>
  )
}
