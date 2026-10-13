import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  alpha,
  Button,
  Card,
  GroupList,
  GroupListItem,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { copyToClipboard } from 'common/utils/clipboard'
import { SECONDS_PER_YEAR } from 'consts/datetime'
import { format, fromUnixTime } from 'date-fns'
import { useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Seconds } from 'types/siUnits'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { formatLargeCurrency, truncateNodeId } from 'utils/Utils'
import { determineNodeTags } from '../utils/determineNodeTags'
import { formatUptime } from '../utils/formatUptime'
import { getValidatorExplorerUrl } from '../utils/getValidatorExplorerUrl'
import { NodeTagPill } from '../components/NodeTagPill'
import { useDelegateNodeSelection } from '../store'

const NODE_ID_LENGTH = 14
const STAT_COLUMNS = 3
const STAT_GAP = 8
const NIL_VALUE = '—'
// Unified min height for the single-row GroupList items (Node, dates, amounts).
const ROW_MIN_HEIGHT = 60
// The validator earns the full (gross) reward on its own stake, so the
// annualized-yield estimate is computed without a delegation fee.
const GROSS_DELEGATION_FEE = 0
const countFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0
})

const NodeDetailsScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const nodes = useDelegateNodeSelection(state => state.nodes)
  const index = useDelegateNodeSelection(state => state.index)
  const setIndex = useDelegateNodeSelection(state => state.setIndex)
  const node = nodes[index]

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken } = NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const avaxPrice = useAvaxPrice()
  const { formatCurrency } = useFormatCurrency()
  const { openUrl } = useInAppBrowser()

  const [gridWidth, setGridWidth] = useState(0)
  const onGridLayout = useCallback((e: LayoutChangeEvent): void => {
    const width = e.nativeEvent.layout.width
    // Only commit a genuinely new width. The stat cells are sized from
    // `gridWidth`, so re-committing it on every layout pass (notably the
    // 0↔real re-measures react-native-screens emits while this screen sits
    // backgrounded behind the amount step) re-renders → resizes the cells →
    // re-lays out the row → fires onLayout again, spinning a layout↔setState
    // loop that pegs the UI thread. Ignoring zero/unchanged widths breaks it.
    setGridWidth(prev =>
      width > 0 && Math.abs(prev - width) >= 1 ? width : prev
    )
  }, [])
  const cellWidth =
    gridWidth > 0
      ? (gridWidth - STAT_GAP * (STAT_COLUMNS - 1)) / STAT_COLUMNS
      : undefined

  const handlePrev = useCallback(() => setIndex(index - 1), [setIndex, index])
  const handleNext = useCallback(() => setIndex(index + 1), [setIndex, index])

  const handleSelect = useCallback((): void => {
    // The picked node lives in the delegate node-selection store, so the
    // amount → duration → confirm steps read it from there (no params).
    navigate({ pathname: '/addStakeV2/delegate/amount' })
  }, [navigate])

  const handleViewInExplorer = useCallback((): void => {
    if (!node) return
    AnalyticsService.capture('ExplorerLinkClicked')
    openUrl(getValidatorExplorerUrl(isDeveloperMode, node.nodeID))
  }, [node, isDeveloperMode, openUrl])

  const tags = useMemo(() => (node ? determineNodeTags(node) : []), [node])

  const weight = useMemo(
    () =>
      new TokenUnit(
        node?.weight ?? 0,
        networkToken.decimals,
        networkToken.symbol
      ),
    [node?.weight, networkToken.decimals, networkToken.symbol]
  )

  const delegatorWeight = useMemo(
    () =>
      new TokenUnit(
        node?.delegatorWeight ?? 0,
        networkToken.decimals,
        networkToken.symbol
      ),
    [node?.delegatorWeight, networkToken.decimals, networkToken.symbol]
  )

  // Available delegation capacity. Mobile derives this from the PVM weights
  // (core-web reads Glacier's precomputed `delegationCapacity`).
  const available = useMemo(
    () =>
      getAvailableDelegationWeight({
        isDeveloperMode,
        validatorWeight: weight,
        delegatorWeight
      }),
    [weight, delegatorWeight, isDeveloperMode]
  )

  const totalStaked = useMemo(
    () => weight.add(delegatorWeight),
    [weight, delegatorWeight]
  )

  // Per-node annualized yield, mirroring core-web's `useStakingRewards`:
  // estimate the reward on the validator's own stake over its full staking
  // period, then compound it to a yearly rate.
  const durationSeconds = node
    ? Number(node.endTime) - Number(node.startTime)
    : 0
  // `useEarnCalcEstimatedRewards` keys its query on the (cached) current
  // supply and derives the reward synchronously in `select` from the amount +
  // duration. That matters when paging nodes: the reward recomputes in the
  // same render as the new node, so the APY never briefly shows a stale
  // reward divided by the new node's stake (which `useStakeEstimatedReward`'s
  // async state would do).
  const { data: rewardData } = useEarnCalcEstimatedRewards({
    amountNanoAvax: weight.toSubUnit(),
    duration: Seconds(durationSeconds > 0 ? durationSeconds : 1),
    delegationFee: GROSS_DELEGATION_FEE
  })

  const apyDisplay = useMemo(() => {
    const stakeAvax = weight.toDisplay({ asNumber: true })
    if (!rewardData || durationSeconds <= 0 || stakeAvax <= 0) return undefined
    const rewardsPercent =
      rewardData.estimatedTokenReward.toDisplay({ asNumber: true }) / stakeAvax
    const periodsPerYear = SECONDS_PER_YEAR / durationSeconds
    const annualized = (1 + rewardsPercent) ** periodsPerYear - 1
    return `${(annualized * 100).toFixed(2)}%`
  }, [rewardData, durationSeconds, weight])

  const formatFiat = useCallback(
    (amount: TokenUnit): string =>
      // App convention: only abbreviate values ≥ 1M (e.g. "$14.81M"); smaller
      // values render in full. Mirrors Track/Token headers.
      formatLargeCurrency(
        formatCurrency({
          amount: amount.mul(avaxPrice).toDisplay({ asNumber: true })
        })
      ),
    [avaxPrice, formatCurrency]
  )

  const stats = useMemo(() => {
    if (!node) return []
    return [
      {
        value: apyDisplay ?? NIL_VALUE,
        caption: 'Annualized percentage yield'
      },
      {
        value: delegatorWeight.toDisplay(),
        caption: 'NodeID delegations (AVAX)'
      },
      {
        value: countFormatter.format(Number(node.delegatorCount ?? 0)),
        caption: 'NodeID delegators'
      },
      { value: weight.toDisplay(), caption: 'Node stake quantity (AVAX)' },
      {
        value: `${Number(node.delegationFee)}%`,
        caption: 'NodeID delegation fee'
      },
      {
        // `formatUptime` truncates below-100 values so a 99.999% node never
        // reads as "100%"; an exact 100 drops the ".00".
        value: `${formatUptime(node.uptime)}%`,
        caption: 'Time responsive'
      }
    ]
  }, [node, apyDisplay, delegatorWeight, weight])

  const identitySection = useMemo<GroupListItem[]>(() => {
    if (!node) return []
    return [
      {
        title: 'Node',
        subtitle: truncateNodeId(node.nodeID, NODE_ID_LENGTH),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(node.nodeID)}>
            Copy
          </Button>
        ),
        onPress: () => copyToClipboard(node.nodeID)
      }
    ]
  }, [node])

  const dateSection = useMemo<GroupListItem[]>(() => {
    if (!node) return []
    const dateValue = (unixSeconds: string | number): JSX.Element => {
      const date = fromUnixTime(Number(unixSeconds))
      return (
        <View sx={{ alignItems: 'flex-end', marginVertical: 8 }}>
          <Text variant="body1" sx={{ color: '$textSecondary', fontSize: 16 }}>
            {format(date, 'MM/dd/yyyy')}
          </Text>
          <Text variant="body1" sx={{ color: '$textSecondary', fontSize: 16 }}>
            {format(date, 'h:mm aa')}
          </Text>
        </View>
      )
    }
    return [
      { title: 'Start date & time', value: dateValue(node.startTime) },
      { title: 'End date & time', value: dateValue(node.endTime) }
    ]
  }, [node])

  const amountSection = useMemo<GroupListItem[]>(() => {
    if (!node) return []
    const amountValue = (amount: TokenUnit): JSX.Element => (
      <View sx={{ alignItems: 'flex-end', marginVertical: 8 }}>
        <Text variant="body1" sx={{ fontSize: 16 }}>
          {`${formatNumber(amount.toDisplay({ asNumber: true }))} ${
            networkToken.symbol
          }`}
        </Text>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          {formatFiat(amount)}
        </Text>
      </View>
    )
    return [
      { title: 'Available amount', value: amountValue(available) },
      { title: 'Total staked amount', value: amountValue(totalStaked) }
    ]
  }, [node, available, totalStaked, networkToken, formatFiat])

  const renderHeaderRight = useCallback(() => {
    const hasPrev = index > 0
    const hasNext = index < nodes.length - 1
    return (
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity onPress={handlePrev} disabled={!hasPrev} hitSlop={8}>
          <Icons.Navigation.ExpandMore
            width={26}
            height={26}
            color={
              hasPrev
                ? theme.colors.$textPrimary
                : alpha(theme.colors.$textPrimary, 0.3)
            }
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} disabled={!hasNext} hitSlop={8}>
          <Icons.Navigation.ExpandMore
            width={26}
            height={26}
            color={
              hasNext
                ? theme.colors.$textPrimary
                : alpha(theme.colors.$textPrimary, 0.3)
            }
          />
        </TouchableOpacity>
      </View>
    )
  }, [index, nodes.length, handlePrev, handleNext, theme.colors.$textPrimary])

  const renderHeader = useCallback(
    () => (
      <View sx={{ marginTop: 8, marginBottom: 16, gap: 12 }}>
        {tags.length > 0 && (
          <View sx={{ flexDirection: 'row', gap: 8 }}>
            {tags.map(tag => (
              <NodeTagPill key={tag} tag={tag} />
            ))}
          </View>
        )}
        <Text variant="heading2">Node details</Text>
      </View>
    ),
    [tags]
  )

  const renderFooter = useCallback(
    () => (
      <Button type="primary" size="large" onPress={handleSelect}>
        Select this node
      </Button>
    ),
    [handleSelect]
  )

  if (!node) {
    return (
      <ScrollScreen
        navigationTitle="Node details"
        isModal
        contentContainerStyle={{ padding: 16 }}>
        <LoadingState sx={{ flex: 1 }} />
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      navigationTitle="Node details"
      isModal
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 10 }}>
        <GroupList
          data={identitySection}
          itemHeight={ROW_MIN_HEIGHT}
          separatorMarginRight={16}
        />
        <GroupList
          data={dateSection}
          itemHeight={ROW_MIN_HEIGHT}
          separatorMarginRight={16}
        />

        <View
          onLayout={onGridLayout}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: STAT_GAP,
            marginVertical: 10
          }}>
          {stats.map(stat => (
            <Card
              key={stat.caption}
              sx={{
                width: cellWidth,
                minHeight: 100,
                padding: 14,
                borderRadius: 12,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: 0
              }}>
              <Text variant="heading6">{stat.value}</Text>
              <Text variant="caption" sx={{ color: '$textSecondary' }}>
                {stat.caption}
              </Text>
            </Card>
          ))}
        </View>

        <GroupList
          data={amountSection}
          itemHeight={ROW_MIN_HEIGHT}
          separatorMarginRight={16}
        />

        <View sx={{ alignItems: 'center', marginTop: 10 }}>
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
      </View>
    </ScrollScreen>
  )
}

export default NodeDetailsScreen
