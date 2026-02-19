import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'
import React from 'react'
import { SwapActivityItem } from '../types'
import { StatusIcon } from './StatusIcon'

type NetworkStatusCardProps = {
  directionLabel: 'From' | 'To'
  networkName?: string
  networkLogoUri?: string
  status: SwapActivityItem['status']
}

export const NetworkStatusCard = ({
  directionLabel,
  networkName,
  networkLogoUri,
  status
}: NetworkStatusCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 18,
        paddingHorizontal: 16
      }}>
      {/* Direction row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14
        }}>
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          {directionLabel}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <NetworkLogo logoUri={networkLogoUri} size={20} />
          {networkName !== undefined && (
            <Text variant="body1" sx={{ color: '$textPrimary' }}>
              {networkName}
            </Text>
          )}
        </View>
      </View>

      <Separator />

      {/* Status row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14
        }}>
        <Text variant="body1" sx={{ color: '$textSecondary' }}>
          Status
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StatusIcon status={status} />
          <Text
            variant="body1"
            sx={{
              color: isCompleted
                ? colors.$textSuccess
                : isFailed
                ? colors.$textDanger
                : colors.$textPrimary
            }}>
            {isCompleted ? 'Complete' : isFailed ? 'Failed' : 'In progress'}
          </Text>
        </View>
      </View>
    </View>
  )
}
