import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  alpha,
  AnimatedPressable,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { format } from 'date-fns'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NodeValidator } from 'types/earn'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { truncateNodeId } from 'utils/Utils'
import { determineNodeTags } from '../utils/determineNodeTags'
import { NodeTagPill } from './NodeTagPill'

// Delegator count is an integer — format with thousands separators and no
// decimals (`formatNumber` forces 2 decimals, which renders e.g. "2,014.00").
const countFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

const ICON_SIZE = 40
// The divider + stats align under the NodeID text column, i.e. past the
// leading icon and its gap.
const CONTENT_INDENT = ICON_SIZE + 12

export const DelegateNodeItem = ({
  node,
  onPress
}: {
  node: NodeValidator
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)

  // Web's `ValidatorItem` shows the date range and delegator count together on
  // the subtitle line ("Jun 29 - Jun 30 2026 | 0 Delegators"), so we mirror
  // that here instead of breaking delegators out into its own stat row.
  const subtitle = useMemo(() => {
    const start = format(new Date(Number(node.startTime) * 1000), 'MMM dd')
    const end = format(new Date(Number(node.endTime) * 1000), 'MMM dd yyyy')
    const delegators = countFormatter.format(Number(node.delegatorCount ?? 0))
    return `${start} - ${end} | ${delegators} Delegators`
  }, [node.startTime, node.endTime, node.delegatorCount])

  const available = useMemo(() => {
    const validatorWeight = new TokenUnit(
      node.weight ?? 0,
      networkToken.decimals,
      networkToken.symbol
    )
    const delegatorWeight = new TokenUnit(
      node.delegatorWeight ?? 0,
      networkToken.decimals,
      networkToken.symbol
    )
    return getAvailableDelegationWeight({
      isDeveloperMode,
      validatorWeight,
      delegatorWeight
    })
  }, [node.weight, node.delegatorWeight, networkToken, isDeveloperMode])

  // Mirror core-web's `ValidatorItem` which renders only the first
  // (highest-priority) tag: Recommended → Popular → Reliable → New.
  const primaryTag = useMemo(() => determineNodeTags(node)[0], [node])

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18,
          paddingLeft: 16,
          paddingRight: 12,
          marginHorizontal: 16,
          marginBottom: 12,
          paddingVertical: 16,
          gap: 12
        }}>
        {/* Top: icon + NodeID/date + tag + chevron */}
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            sx={{
              width: ICON_SIZE,
              height: ICON_SIZE,
              borderRadius: ICON_SIZE / 2,
              // Theme-adaptive neutral so the chip reads as a light-grey
              // circle in light mode and a subtly lighter circle on the dark
              // card (not `$surfacePrimary`, which is darker than the card in
              // dark mode and renders near-black).
              backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Icons.Custom.Database
              width={24}
              height={24}
              color={theme.colors.$textPrimary}
            />
          </View>
          <View sx={{ flex: 1, gap: 2 }}>
            <Text variant="body1" sx={{ fontWeight: 600 }}>
              {truncateNodeId(node.nodeID)}
            </Text>
            <Text variant="body2" sx={{ color: '$textSecondary' }}>
              {subtitle}
            </Text>
          </View>
          {primaryTag !== undefined && <NodeTagPill tag={primaryTag} />}
          <Icons.Navigation.ChevronRight color={theme.colors.$textSecondary} />
        </View>

        {/* Divider + stats, aligned under the NodeID text column */}
        <View sx={{ marginLeft: CONTENT_INDENT, gap: 12 }}>
          <View
            sx={{ height: 1, backgroundColor: theme.colors.$borderPrimary }}
          />
          {/* Web's `ValidatorItem` shows only uptime + available capacity as
           * the trailing stats (uptime always in the success colour), with
           * the delegator count folded into the subtitle above. */}
          <View sx={{ gap: 2 }}>
            <Text variant="body2" sx={{ color: '$textSuccess' }}>
              {`${formatNumber(node.uptime)}% uptime`}
            </Text>
            <Text variant="body2" sx={{ color: '$textPrimary' }}>
              {`${available.toDisplay()} AVAX available`}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  )
}
