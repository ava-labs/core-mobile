import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

const MaliciousActivityWarning = ({
  result,
  title,
  subTitle,
  style
}: {
  result?: 'malicious' | 'warning'
  title: string
  subTitle: string
  style?: StyleProp<ViewStyle>
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }

  const icon = useMemo(() => {
    if (result === 'malicious') {
      return <Icons.Social.RemoveModerator color={colors.$black} />
    }

    return <Icons.Device.IconGPPMaybe color={colors.$black} />
  }, [result, colors])

  if (!result || (result !== 'malicious' && result !== 'warning')) return null

  return (
    <View
      style={style}
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor:
          result === 'malicious' ? '$dangerLight' : '$warningLight',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13
      }}>
      {icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>{title}</Text>
        <Text sx={{ ...textStyle }}>{subTitle}</Text>
      </View>
    </View>
  )
}

export default MaliciousActivityWarning
