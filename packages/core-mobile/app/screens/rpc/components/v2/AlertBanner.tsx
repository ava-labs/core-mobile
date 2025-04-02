import { Icons, Text, View, alpha, useTheme } from '@avalabs/k2-mobile'
import { Alert, AlertType } from '@avalabs/vm-module-types'
import InfoSVG from 'components/svg/InfoSVG'
import React, { useMemo } from 'react'

interface AlertBannerProps {
  alert: Alert
  customStyle?: {
    borderColor?: string
    backgroundColor?: string
    iconColor?: string
  }
}

const AlertBanner = ({
  alert,
  customStyle
}: AlertBannerProps): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()

  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }
  const icon = useMemo(() => {
    const iconColor = customStyle?.iconColor || colors.$black

    if (alert.type === AlertType.DANGER) {
      return <Icons.Social.RemoveModerator color={iconColor} />
    }

    if (alert.type === AlertType.WARNING) {
      return <Icons.Device.IconGPPMaybe color={iconColor} />
    }

    return (
      <InfoSVG
        color={customStyle?.iconColor || colors.$warningLight}
        size={24}
      />
    )
  }, [alert, colors, customStyle?.iconColor])

  if (alert.type === AlertType.INFO) {
    return (
      <View
        sx={{
          flexDirection: 'row',
          borderColor: customStyle?.borderColor || '$warningLight',
          borderRadius: 8,
          borderWidth: 1,
          padding: 16,
          backgroundColor:
            customStyle?.backgroundColor || alpha(colors.$warningDark, 0.1),
          alignItems: 'center',
          gap: 12
        }}>
        {icon}
        <View sx={{ flex: 1 }}>
          <Text variant="alertTitle">{alert.details.title}</Text>
          <Text variant="alertDescription">{alert.details.description}</Text>
        </View>
      </View>
    )
  }

  return (
    <View
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor:
          customStyle?.backgroundColor ||
          (alert.type === AlertType.DANGER ? '$dangerLight' : '$warningLight'),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
      }}>
      {icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>
          {alert.details.title}
        </Text>
        <Text sx={{ ...textStyle, marginRight: 16 }}>
          {alert.details.description}
        </Text>
      </View>
    </View>
  )
}

export default AlertBanner
