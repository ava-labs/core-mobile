import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'
import React from 'react'
import { NotificationSwapStatus } from '../types'
import { StatusIcon } from './StatusIcon'

type SwapStatusCardProps = {
  directionLabel: 'From' | 'To'
  networkName?: string
  networkLogoUri?: string
  status: NotificationSwapStatus
}

export const SwapStatusCard = ({
  directionLabel,
  networkName,
  networkLogoUri,
  status
}: SwapStatusCardProps): JSX.Element => {
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
        <Text
          variant="body1"
          sx={{ color: '$textPrimary', lineHeight: 22, fontWeight: '500' }}>
          {directionLabel}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <NetworkLogo logoUri={networkLogoUri} size={20} />
          {networkName !== undefined && (
            <Text
              variant="body1"
              sx={{ color: '$textPrimary', lineHeight: 22 }}>
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
        <Text
          variant="body1"
          sx={{ color: '$textPrimary', lineHeight: 22, fontWeight: '500' }}>
          Status
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StatusIcon status={status} />
          <Text
            variant="body1"
            sx={{
              lineHeight: 22,
              fontWeight: '500',
              color: isCompleted
                ? colors.$textSuccess
                : isFailed
                ? colors.$textDanger
                : colors.$textSecondary
            }}>
            {isCompleted ? 'Complete' : isFailed ? 'Failed' : 'Pending...'}
          </Text>
        </View>
      </View>
    </View>
  )
}
