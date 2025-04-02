import {
  Button,
  GroupList,
  GroupListItem,
  ScrollView,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'

import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import ScreenHeader from 'common/components/ScreenHeader'
import {
  getActiveStakeProgress,
  getEarnedRewardAmount,
  getEstimatedRewardAmount,
  getRemainingReadableTime,
  getStakedAmount,
  getStakeTitle
} from 'features/stake/utils'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useStake } from 'hooks/earn/useStake'
import { isOnGoing } from 'utils/earn/status'
import { useLocalSearchParams } from 'expo-router'
import { round } from 'lodash'
import { format, fromUnixTime } from 'date-fns'
import { truncateAddress, truncateNodeId } from 'utils/Utils'
import { copyToClipboard } from 'common/utils/clipboard'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'

const StakeDetailScreen = (): React.JSX.Element => {
  const { txHash } = useLocalSearchParams<{ txHash: string }>()
  const stake = useStake(txHash)
  const isDevMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDevMode)
  const now = useMemo(() => new Date(), [])
  const isActive = useMemo(() => {
    if (!stake) return false

    return isOnGoing(stake, now)
  }, [stake, now])

  const title = useMemo(() => {
    if (!stake) return ''

    return getStakeTitle({
      stake,
      pChainNetworkToken,
      isActive,
      forCard: false
    })
  }, [stake, pChainNetworkToken, isActive])

  const groupListSections = useMemo(() => {
    if (!stake) return []

    const sections: GroupListItem[][] = []

    if (stake.nodeId) {
      sections.push([
        {
          title: 'NodeID',
          subtitle: truncateNodeId(stake.nodeId, HASH_LENGTH),
          accessory: (
            <Button
              size="small"
              type="secondary"
              onPress={() => copyToClipboard(stake.nodeId)}>
              Copy
            </Button>
          ),
          onPress: () => {
            copyToClipboard(stake.nodeId)
          }
        }
      ])
    }

    if (isActive) {
      sections.push([
        {
          title: 'Vesting progress',
          value: `${round(
            getActiveStakeProgress(stake, new Date()) * 100,
            0
          ).toString()}%`
        },
        {
          title: 'Time to unlock',
          value: `${getRemainingReadableTime(stake)} left`
        },
        {
          title: 'Locked until',
          value: format(
            fromUnixTime(stake.endTimestamp || 0),
            'MM/dd/yyyy h:mm aa'
          )
        }
      ])
    } else {
      sections.push([
        {
          title: 'Vesting progress',
          value: '100%'
        },
        {
          title: 'End date',
          value: format(fromUnixTime(stake.endTimestamp || 0), 'MM/dd/yyyy')
        }
      ])
    }

    if (!isActive && stake.txHash) {
      sections.push([
        {
          title: 'Transaction ID',
          subtitle: truncateAddress(stake.txHash, HASH_LENGTH),
          accessory: (
            <Button
              size="small"
              type="secondary"
              onPress={() => {
                copyToClipboard(stake.txHash)
              }}>
              Copy
            </Button>
          ),
          onPress: () => {
            copyToClipboard(stake.txHash)
          }
        }
      ])
    }

    sections.push([
      {
        title: 'Staked amount',
        value: (
          <StakeTokenUnitValue
            value={getStakedAmount(stake, pChainNetworkToken)}
          />
        )
      },
      isActive
        ? {
            title: 'Estimated reward',
            value: (
              <StakeTokenUnitValue
                value={getEstimatedRewardAmount(stake, pChainNetworkToken)}
                isReward
              />
            )
          }
        : {
            title: 'Earned reward',
            value: (
              <StakeTokenUnitValue
                value={getEarnedRewardAmount(stake, pChainNetworkToken)}
                isReward
              />
            )
          }
    ])

    return sections
  }, [stake, isActive, pChainNetworkToken])

  return (
    <BlurredBarsContentLayout>
      <ScrollView
        sx={{
          flex: 1
        }}
        contentContainerSx={{ padding: 16, paddingTop: 8 }}>
        <ScreenHeader title={title} />
        <View sx={{ marginTop: 20, gap: 12 }}>
          {groupListSections.map((section, index) => (
            <GroupList key={index} data={section} />
          ))}
        </View>
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

const HASH_LENGTH = 14

export default StakeDetailScreen
