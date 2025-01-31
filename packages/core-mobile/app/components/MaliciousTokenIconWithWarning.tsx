import { Icons, useTheme } from '@avalabs/k2-mobile'
import React from 'react'
import { Tooltip } from './Tooltip'

interface Props {
  contentWidth?: number
  position?: 'top' | 'right' | 'bottom' | 'left'
}

export const MaliciousTokenIconWithWarning = ({
  contentWidth,
  position
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Tooltip
      content="This token has been flagged as malicious"
      position={position}
      style={{ width: contentWidth }}
      hitslop={{ left: 25, right: 5, top: 5, bottom: 5 }}
      icon={
        <Icons.Alert.IconWarningAmber
          color={colors.$warningLight}
          width={24}
          height={24}
        />
      }
    />
  )
}
