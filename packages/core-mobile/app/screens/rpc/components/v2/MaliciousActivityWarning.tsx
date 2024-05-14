import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { useMemo } from 'react'
import { MaliciousActivityType } from 'services/blockaid/types'

const MaliciousActivityWarning = ({
  activity,
  result
}: {
  activity: MaliciousActivityType
  result: 'Malicious' | 'Warning'
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }

  const icon = useMemo(() => {
    if (result === 'Malicious') {
      return <Icons.Social.RemoveModerator color={colors.$black} />
    }

    return <Icons.Device.IconGPPMaybe color={colors.$black} />
  }, [result, colors])

  const content = useMemo(() => {
    if (activity === 'Transaction') {
      if (result === 'Malicious') {
        return {
          title: 'Scam Transaction',
          subtitle: 'This transaction is malicious, do not proceed.'
        }
      }

      if (result === 'Warning') {
        return {
          title: 'Suspicious Transaction',
          subtitle: 'Use caution, this transaction may be malicious.'
        }
      }
    }

    if (activity === 'SessionProposal') {
      if (result === 'Malicious') {
        return {
          title: 'Scam Application',
          subtitle: 'This application is malicious, do not proceed.'
        }
      }

      if (result === 'Warning') {
        return {
          title: 'Suspicious Application',
          subtitle: 'Use caution, this application may be malicious.'
        }
      }
    }

    throw new Error(
      '[MaliciousActivityWarning] Invalid activity or result type'
    )
  }, [result, activity])

  return (
    <View
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor:
          result === 'Malicious' ? '$dangerLight' : '$warningLight',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13
      }}>
      {icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>{content.title}</Text>
        <Text sx={{ ...textStyle }}>{content.subtitle}</Text>
      </View>
    </View>
  )
}

export default MaliciousActivityWarning
