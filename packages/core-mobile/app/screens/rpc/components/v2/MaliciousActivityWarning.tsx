import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { TransactionValidationResultType } from '@avalabs/vm-module-types'
import React, { useMemo } from 'react'

const MaliciousActivityWarning = ({
  resultType,
  title,
  description
}: {
  resultType: TransactionValidationResultType
  title: string
  description: string
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }
  const isMalicious = resultType === TransactionValidationResultType.MALICIOUS
  const isSuspicious =
    resultType === TransactionValidationResultType.WARNING ||
    resultType === TransactionValidationResultType.ERROR

  const icon = useMemo(() => {
    if (isMalicious) {
      return <Icons.Social.RemoveModerator color={colors.$black} />
    }

    return <Icons.Device.IconGPPMaybe color={colors.$black} />
  }, [isMalicious, colors])

  if (!isMalicious && !isSuspicious) return null

  return (
    <View
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor: isMalicious ? '$dangerLight' : '$warningLight',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13
      }}>
      {icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>{title}</Text>
        <Text sx={{ ...textStyle }}>{description}</Text>
      </View>
    </View>
  )
}

export default MaliciousActivityWarning
