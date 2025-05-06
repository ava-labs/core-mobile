import {
  Button,
  GroupList,
  GroupListItem,
  SxProp,
  View
} from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'

import { ScrollScreen } from 'common/components/ScrollScreen'
import { copyToClipboard } from 'common/utils/clipboard'
import { format, fromUnixTime } from 'date-fns'
import { useLocalSearchParams } from 'expo-router'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import {
  getActiveStakeProgress,
  getEarnedRewardAmount,
  getEstimatedRewardAmount,
  getRemainingReadableTime,
  getStakedAmount,
  getStakeTitle
} from 'features/stake/utils'
import { useStake } from 'hooks/earn/useStake'
import { round } from 'lodash'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { isOnGoing } from 'utils/earn/status'
import { truncateNodeId } from 'utils/Utils'
import { truncateAddress } from '@avalabs/core-utils-sdk'

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

    const sections: { items: GroupListItem[]; textContainerSx?: SxProp }[] = []

    if (stake.nodeId) {
      sections.push({
        items: [
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
        ]
      })
    }

    if (isActive) {
      sections.push({
        items: [
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
        ]
      })
    } else {
      sections.push({
        items: [
          {
            title: 'Vesting progress',
            value: '100%'
          },
          {
            title: 'End date',
            value: format(fromUnixTime(stake.endTimestamp || 0), 'MM/dd/yyyy')
          }
        ]
      })
    }

    if (!isActive && stake.txHash) {
      sections.push({
        items: [
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
        ]
      })
    }

    sections.push({
      items: [
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
      ],
      textContainerSx: {
        marginTop: 0
      }
    })

    return sections
  }, [stake, isActive, pChainNetworkToken])

  return (
    <ScrollScreen
      title={title}
      navigationTitle="Stake detail"
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View sx={{ marginTop: 24, gap: 12 }}>
        {groupListSections.map((section, index) => (
          <GroupList
            key={index}
            data={section.items}
            textContainerSx={section.textContainerSx}
          />
        ))}
      </View>
    </ScrollScreen>
  )
}

const HASH_LENGTH = 14

export default StakeDetailScreen
