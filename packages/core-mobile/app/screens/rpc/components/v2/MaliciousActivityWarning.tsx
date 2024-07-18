import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { Alert, AlertType } from '@avalabs/vm-module-types'
import React, { useMemo } from 'react'

const MaliciousActivityWarning = ({
  alert
}: {
  alert: Alert
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }
  const isDanger = alert.type === AlertType.DANGER

  const icon = useMemo(() => {
    if (isDanger) {
      return <Icons.Social.RemoveModerator color={colors.$black} />
    }

    return <Icons.Device.IconGPPMaybe color={colors.$black} />
  }, [isDanger, colors])

  return (
    <View
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor: isDanger ? '$dangerLight' : '$warningLight',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13
      }}>
      {icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>
          {alert.details.title}
        </Text>
        <Text sx={{ ...textStyle }}>{alert.details.description}</Text>
      </View>
    </View>
  )
}

export default MaliciousActivityWarning
