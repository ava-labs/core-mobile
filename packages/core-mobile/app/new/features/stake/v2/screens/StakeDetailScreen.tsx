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
import { round } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectStakeAnnualPercentageYieldBPS } from 'store/posthog'
import { isOnGoing } from 'utils/earn/status'
import { getExplorerAddressByNetwork } from 'utils/getExplorerAddressByNetwork'
import { truncateNodeId } from 'utils/Utils'

const HASH_LENGTH = 14

export const StakeDetailScreen = (): React.JSX.Element => {
  const { txHash } = useLocalSearchParams<{ txHash: string }>()
  const stake = useStake(txHash)
  const isDevMode = useSelector(selectIsDeveloperMode)
  const apyBps = useSelector(selectStakeAnnualPercentageYieldBPS)
  const pChainNetwork = NetworkService.getAvalancheNetworkP(isDevMode)
  const { networkToken: pChainNetworkToken } = pChainNetwork
  const { openUrl } = useInAppBrowser()
  const { theme } = useTheme()

  const now = useMemo(() => new Date(), [])
  const isActive = useMemo(() => {
    if (!stake) return false
    return isOnGoing(stake, now)
  }, [stake, now])

  const progressPercent = useMemo(() => {
    if (!stake) return 0
    if (!isActive) return 100
    return round(getActiveStakeProgress(stake, now) * 100, 0)
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
      value: (
        <StakeTokenUnitValue
          value={networkFeeTokenUnit}
          containerSx={{ marginVertical: 13 }}
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
      value: (
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {isActive && (
            <View
              sx={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.colors.$textSuccess
              }}
            />
          )}
          <Text>{isActive ? 'Active' : 'Completed'}</Text>
        </View>
      )
    })

    return items
  }, [stake, isActive, theme.colors.$textSuccess])

  // ── Card 5: Staked amount / (Estimated|Earned) reward / Estimated yield ─
  const rewardSection = useMemo<GroupListItem[]>(() => {
    if (!stake) return []
    const items: GroupListItem[] = []

    items.push({
      title: 'Staked amount',
      value: (
        <StakeTokenUnitValue
          value={stakedTokenUnit}
          containerSx={{ marginVertical: 13 }}
        />
      )
    })

    items.push({
      title: isActive ? 'Estimated reward' : 'Earned reward',
      value: (
        <StakeTokenUnitValue
          value={rewardTokenUnit}
          isReward
          containerSx={{ marginVertical: 13 }}
        />
      )
    })

    // Estimated yield only applies to ongoing stakes — completed stakes have a
    // realized reward instead of a forward-looking yield estimate.
    if (isActive) {
      items.push({
        title: 'Estimated yield',
        value: (
          <View sx={{ alignItems: 'flex-end', marginVertical: 13 }}>
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
        <View sx={{ gap: 4 }}>
          <Card
            sx={{
              paddingTop: 18,
              paddingBottom: 22,
              paddingHorizontal: 16,
              alignItems: 'stretch',
              borderRadius: 12,
              borderBottomRightRadius: 4,
              borderBottomLeftRadius: 4
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
              style={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }}
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

        {stake?.txHash && pChainNetwork.explorerUrl && (
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
