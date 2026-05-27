import { TokenUnit, truncateAddress } from '@avalabs/core-utils-sdk'
import {
  Button,
  Card,
  GroupList,
  GroupListItem,
  Icons,
  ProgressDial,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { copyToClipboard } from 'common/utils/clipboard'
import { format, fromUnixTime } from 'date-fns'
import { useLocalSearchParams } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import {
  getActiveStakeProgress,
  getEarnedRewardAmount,
  getEstimatedRewardAmount,
  getRemainingReadableTime,
  getStakedAmount
} from 'features/stake/utils'
import { useStake } from 'hooks/earn/useStake'
import { clamp, round } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectStakeAnnualPercentageYieldBPS } from 'store/posthog'
import { isOnGoing } from 'utils/earn/status'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { truncateNodeId } from 'utils/Utils'
import { StakeStatusValue } from '../components/StakeStatusValue'

const HASH_LENGTH = 14

export const StakeDetailScreen = (): React.JSX.Element => {
  const { txHash } = useLocalSearchParams<{ txHash: string }>()
  const stake = useStake(txHash)
  const isDevMode = useSelector(selectIsDeveloperMode)
  const apyBps = useSelector(selectStakeAnnualPercentageYieldBPS)
  const pChainNetwork = useMemo(
    () => NetworkService.getAvalancheNetworkP(isDevMode),
    [isDevMode]
  )
  const { networkToken: pChainNetworkToken } = pChainNetwork
  const { openUrl } = useInAppBrowser()
  const { theme } = useTheme()

  // Time-sensitive values ("Time to unlock", progress) snapshot when the
  // screen mounts. They don't tick live — we accept that small staleness in
  // exchange for fewer re-renders; users typically don't keep this screen
  // open long enough for the drift to matter.
  const now = useMemo(() => new Date(), [])
  const isActive = useMemo(() => {
    if (!stake) return false
    return isOnGoing(stake, now)
  }, [stake, now])

  const progressPercent = useMemo(() => {
    if (!stake) return 0
    if (!isActive) return 100
    // `getActiveStakeProgress` is the raw (now - start) / (end - start)
    // ratio, which can be negative for scheduled (future-start) stakes or
    // exceed 1 for stakes with malformed timestamps. Clamp here so the
    // numeric label stays consistent with the arc — `ProgressDial` only
    // clamps its arc fill, not the value text passed in.
    return clamp(round(getActiveStakeProgress(stake, now) * 100, 0), 0, 100)
  }, [stake, isActive, now])

  const networkFeeTokenUnit = useMemo(() => {
    const amount = stake?.amountBurned?.[0]?.amount
    if (!amount) return undefined
    return new TokenUnit(
      amount,
      pChainNetworkToken.decimals,
      pChainNetworkToken.symbol
    )
  }, [stake, pChainNetworkToken])

  const stakedTokenUnit = useMemo(() => {
    if (!stake) return undefined
    return getStakedAmount(stake, pChainNetworkToken)
  }, [stake, pChainNetworkToken])

  const rewardTokenUnit = useMemo(() => {
    if (!stake) return undefined
    return isActive
      ? getEstimatedRewardAmount(stake, pChainNetworkToken)
      : getEarnedRewardAmount(stake, pChainNetworkToken)
  }, [stake, isActive, pChainNetworkToken])

  // Network-wide APY is provided in basis points (e.g. 255 → 2.55%).
  const apyDisplay = useMemo(() => `${(apyBps / 100).toFixed(2)}%`, [apyBps])

  const handleViewInExplorer = useCallback(() => {
    if (!stake?.txHash || !pChainNetwork.explorerUrl) return
    const url = getExplorerAddressByNetwork(
      pChainNetwork.explorerUrl,
      stake.txHash,
      'tx'
    )
    AnalyticsService.capture('ExplorerLinkClicked')
    openUrl(url)
  }, [stake?.txHash, pChainNetwork.explorerUrl, openUrl])

  // ── Card 1: Node + Transaction ID ────────────────────────────────────────
  const identitySection = useMemo<GroupListItem[]>(() => {
    if (!stake) return []
    const items: GroupListItem[] = []
    if (stake.nodeId) {
      items.push({
        title: 'Node',
        subtitle: truncateNodeId(stake.nodeId, HASH_LENGTH),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(stake.nodeId)}>
            Copy
          </Button>
        ),
        onPress: () => copyToClipboard(stake.nodeId)
      })
    }
    if (stake.txHash) {
      items.push({
        title: 'Transaction ID',
        subtitle: truncateAddress(stake.txHash, HASH_LENGTH),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(stake.txHash)}>
            Copy
          </Button>
        ),
        onPress: () => copyToClipboard(stake.txHash)
      })
    }
    return items
  }, [stake])

  // ── Card 3: Time to unlock / Locked until / Network fee ─────────────────
  const lockSection = useMemo<GroupListItem[]>(() => {
    if (!stake) return []
    const items: GroupListItem[] = []

    if (isActive) {
      items.push({
        title: 'Time to unlock',
        value: `${getRemainingReadableTime(stake)} left`
      })
      const endDate = fromUnixTime(stake.endTimestamp || 0)
      items.push({
        title: 'Locked until',
        value: (
          <View sx={{ alignItems: 'flex-end', marginVertical: 10 }}>
            <Text
              variant="body1"
              sx={{ color: '$textSecondary', fontSize: 16 }}>
              {format(endDate, 'MM/dd/yyyy')}
            </Text>
            <Text
              variant="body1"
              sx={{ color: '$textSecondary', fontSize: 16 }}>
              {format(endDate, 'h:mm aa')}
            </Text>
          </View>
        )
      })
    } else {
      items.push({
        title: 'End date',
        value: format(fromUnixTime(stake.endTimestamp || 0), 'MM/dd/yyyy')
      })
    }

    items.push({
      title: 'Network fee',
      // Custom marginVertical keeps the dual-line token+fiat readout
      // vertically centered inside the GroupList row's 48px itemHeight.
      // Reused on every StakeTokenUnitValue cell below.
      value: (
        <StakeTokenUnitValue
          value={networkFeeTokenUnit}
          containerSx={VALUE_CELL_CONTAINER_SX}
        />
      )
    })

    return items
  }, [stake, isActive, networkFeeTokenUnit])

  // ── Card 4: Stake type / Status ─────────────────────────────────────────
  const stateSection = useMemo<GroupListItem[]>(() => {
    if (!stake) return []
    const items: GroupListItem[] = []

    // All stakes are assumed to be Fast stake for now (Delegate /
    // Validate detection comes later when the underlying logic is defined).
    items.push({
      title: 'Stake type',
      value: 'Fast stake'
    })

    items.push({
      title: 'Status',
      value: <StakeStatusValue isActive={isActive} />
    })

    return items
  }, [stake, isActive])

  // ── Card 5: Staked amount / (Estimated|Earned) reward / Estimated yield ─
  const rewardSection = useMemo<GroupListItem[]>(() => {
    if (!stake) return []
    const items: GroupListItem[] = []

    items.push({
      title: 'Staked amount',
      value: (
        <StakeTokenUnitValue
          value={stakedTokenUnit}
          containerSx={VALUE_CELL_CONTAINER_SX}
        />
      )
    })

    items.push({
      title: isActive ? 'Estimated reward' : 'Earned reward',
      value: (
        <StakeTokenUnitValue
          value={rewardTokenUnit}
          isReward
          containerSx={VALUE_CELL_CONTAINER_SX}
        />
      )
    })

    // Estimated yield only applies to ongoing stakes — completed stakes have a
    // realized reward instead of a forward-looking yield estimate.
    if (isActive) {
      items.push({
        title: 'Estimated yield',
        value: (
          <View sx={{ alignItems: 'flex-end', ...VALUE_CELL_CONTAINER_SX }}>
            <Text variant="body1" sx={{ color: '$textSuccess' }}>
              {apyDisplay}
            </Text>
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              APY
            </Text>
          </View>
        )
      })
    }

    return items
  }, [stake, isActive, stakedTokenUnit, rewardTokenUnit, apyDisplay])

  if (!stake) {
    return (
      <ScrollScreen
        title="Stake details"
        navigationTitle="Stake details"
        contentContainerStyle={{ padding: 16 }}>
        <LoadingState sx={{ flex: 1 }} />
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      title="Stake details"
      navigationTitle="Stake details"
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginTop: 8, gap: 10 }}>
        {identitySection.length > 0 && (
          <GroupList
            data={identitySection}
            itemHeight={48}
            separatorMarginRight={16}
          />
        )}
        {/*
         * "Joined stack" — the ProgressDial Card and the lockSection
         * GroupList form a single visual group: a 4px outer gap separates
         * them, and tight `JOINED_STACK_RADIUS` corner radii on the inner
         * edges make them read as one card with a divider. Both halves must
         * use the same inner-edge radius to keep the seam aligned.
         */}
        <View sx={{ gap: 4 }}>
          <Card
            sx={{
              paddingTop: 18,
              paddingBottom: 22,
              paddingHorizontal: 16,
              alignItems: 'stretch',
              borderRadius: 12,
              borderBottomRightRadius: JOINED_STACK_RADIUS,
              borderBottomLeftRadius: JOINED_STACK_RADIUS
            }}>
            <ProgressDial
              progress={progressPercent / 100}
              value={`${progressPercent}%`}
              caption="Staking progress"
            />
          </Card>
          {lockSection.length > 0 && (
            <GroupList
              data={lockSection}
              itemHeight={48}
              style={{
                borderTopLeftRadius: JOINED_STACK_RADIUS,
                borderTopRightRadius: JOINED_STACK_RADIUS
              }}
              separatorMarginRight={16}
            />
          )}
        </View>
        {stateSection.length > 0 && (
          <GroupList
            data={stateSection}
            itemHeight={48}
            separatorMarginRight={16}
          />
        )}
        {rewardSection.length > 0 && (
          <GroupList
            data={rewardSection}
            itemHeight={48}
            separatorMarginRight={16}
          />
        )}

        {stake.txHash && pChainNetwork.explorerUrl && (
          <View sx={{ alignItems: 'center', marginTop: 14 }}>
            <Button
              type="secondary"
              size="small"
              rightIcon={
                <View sx={{ marginLeft: 8, marginRight: -10 }}>
                  <Icons.Custom.Outbound
                    color={theme.colors.$textPrimary}
                    width={20}
                    height={20}
                  />
                </View>
              }
              onPress={handleViewInExplorer}>
              View in Avalanche Explorer
            </Button>
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}

// Inner-edge corner radius shared by the ProgressDial Card and the GroupList
// directly below it. See "Joined stack" comment above for the visual intent.
const JOINED_STACK_RADIUS = 4

// Custom marginVertical applied to cells that host a `StakeTokenUnitValue`
// (or its inlined equivalent). Keeps the dual-line token+fiat readout
// vertically centered inside the GroupList row's 48px itemHeight.
const VALUE_CELL_CONTAINER_SX = { marginVertical: 13 } as const
