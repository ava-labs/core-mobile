import { Separator, Text, useTheme, View } from '@avalabs/k2-alpine'
import { NetworkLogo } from 'common/components/NetworkLogo'
import React from 'react'
import { NotificationSwapStatus } from '../types'
import { SwapStatusIcon } from './SwapStatusIcon'

type SwapStatusCardProps = {
  directionLabel: 'From' | 'To'
  networkName?: string
  networkLogoUri?: string
  networkChainId?: number
  status: NotificationSwapStatus
  note?: string
  confirmations?: { count: number; required: number }
}

export const SwapStatusCard = ({
  directionLabel,
  networkName,
  networkLogoUri,
  networkChainId,
  status,
  note,
  confirmations
}: SwapStatusCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  let statusTitle: string
  let statusColor: string
  switch (status) {
    case NotificationSwapStatus.Completed:
      statusTitle = 'Complete'
      statusColor = colors.$textSuccess
      break
    case NotificationSwapStatus.Failed:
      statusTitle = 'Failed'
      statusColor = colors.$textDanger
      break
    case NotificationSwapStatus.Incomplete:
      statusTitle = 'Incomplete'
      statusColor = colors.$textDanger
      break
    default:
      statusTitle = 'Pending...'
      statusColor = colors.$textSecondary
  }

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
          <NetworkLogo
            logoUri={networkLogoUri}
            chainId={networkChainId}
            size={20}
          />
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
          <SwapStatusIcon status={status} />
          <Text
            variant="body1"
            sx={{
              lineHeight: 22,
              fontWeight: '500',
              color: statusColor
            }}>
            {statusTitle}
          </Text>
        </View>
      </View>

      {confirmations !== undefined && (
        <>
          <Separator />
          <View style={{ paddingVertical: 14, gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <Text
                variant="body1"
                sx={{
                  color: '$textPrimary',
                  lineHeight: 22,
                  fontWeight: '500'
                }}>
                Confirmations
              </Text>
              <Text
                variant="body1"
                sx={{ color: '$textSecondary', lineHeight: 22 }}>
                {confirmations.count}/{confirmations.required}
              </Text>
            </View>
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: colors.$borderPrimary,
                overflow: 'hidden'
              }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: colors.$textSuccess,
                  width: `${Math.min(
                    (confirmations.count /
                      Math.max(confirmations.required, 1)) *
                      100,
                    100
                  )}%`
                }}
              />
            </View>
          </View>
        </>
      )}

      {note !== undefined && (
        <>
          <Separator />
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
              Note
            </Text>
            <Text
              variant="body2"
              sx={{
                color: '$textSecondary',
                lineHeight: 20,
                flex: 1,
                textAlign: 'right',
                marginLeft: 16
              }}>
              {note}
            </Text>
          </View>
        </>
      )}
    </View>
  )
}
