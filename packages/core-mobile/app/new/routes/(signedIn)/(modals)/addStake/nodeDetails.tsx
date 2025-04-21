import React, { useCallback, useMemo } from 'react'
import {
  Button,
  GroupList,
  GroupListItem,
  SafeAreaView,
  ScrollView,
  Tooltip,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { useLocalSearchParams } from 'expo-router'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import { truncateNodeId } from 'utils/Utils'
import { copyToClipboard } from 'common/utils/clipboard'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import NetworkService from 'services/network/NetworkService'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const StakeNodeDetails = (): JSX.Element => {
  const { navigate } = useDebouncedRouter()

  const { stakeEndTime, nodeId } = useLocalSearchParams<{
    stakeEndTime: string
    nodeId: string
  }>()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { networkToken: pChainNetworkToken } =
    NetworkService.getAvalancheNetworkP(isDeveloperMode)
  const validator = useGetValidatorByNodeId(nodeId)
  const validatorWeight = useMemo(() => {
    if (!validator) return undefined

    return new TokenUnit(
      validator.weight,
      pChainNetworkToken.decimals,
      pChainNetworkToken.symbol
    )
  }, [validator, pChainNetworkToken])

  const delegatorWeight = useMemo(() => {
    if (!validator) return undefined

    return new TokenUnit(
      validator.delegatorWeight,
      pChainNetworkToken.decimals,
      pChainNetworkToken.symbol
    )
  }, [validator, pChainNetworkToken])

  const availableDelegationWeight = useMemo(() => {
    if (!validatorWeight || !delegatorWeight) return

    return getAvailableDelegationWeight({
      isDeveloperMode,
      validatorWeight,
      delegatorWeight
    })
  }, [validatorWeight, delegatorWeight, isDeveloperMode])

  const handlePressNext = useCallback(() => {
    navigate({
      pathname: '/addStake/confirm',
      params: {
        stakeEndTime,
        nodeId
      }
    })
  }, [navigate, stakeEndTime, nodeId])

  const details = useMemo(() => {
    if (!validator) return []

    const section: GroupListItem[] = [
      {
        title: 'NodeID',
        subtitle: truncateNodeId(validator.nodeID, 14),
        accessory: (
          <Button
            size="small"
            type="secondary"
            onPress={() => copyToClipboard(validator.nodeID)}>
            Copy
          </Button>
        ),
        onPress: () => {
          copyToClipboard(validator.nodeID)
        }
      },
      {
        title: 'Staking fee',
        rightIcon: (
          <Tooltip
            title="Staking fee"
            description="Fee set and retained by the validator"
          />
        ),
        value: `${Number(validator.delegationFee).toFixed(0)}%`
      }
    ]

    if (validatorWeight) {
      section.push({
        title: 'Validator stake',
        rightIcon: (
          <Tooltip
            title="Validator stake"
            description="Amount of AVAX staked by the validator"
          />
        ),
        value: formatNumber(validatorWeight.toString())
      })
    }

    if (availableDelegationWeight) {
      section.push({
        title: 'Availability',
        rightIcon: (
          <Tooltip
            title="Availability"
            description="Amount of AVAX the validator can accept"
          />
        ),
        value: formatNumber(availableDelegationWeight.toString())
      })
    }

    section.push({
      title: 'Delegates',
      rightIcon: (
        <Tooltip
          title="Delegates"
          description="Number of addresses delegating to the validator"
        />
      ),
      value: validator.delegatorCount
    })

    return section
  }, [validator, validatorWeight, availableDelegationWeight])

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <ScrollView
        sx={{ paddingHorizontal: 16, paddingBottom: 16 }}
        contentContainerSx={{ gap: 16 }}>
        <ScreenHeader title="Node details" />
        <GroupList data={details} />
      </ScrollView>
      <LinearGradientBottomWrapper>
        <View
          sx={{
            padding: 16,
            gap: 16,
            backgroundColor: '$surfacePrimary'
          }}>
          <Button type="primary" size="large" onPress={handlePressNext}>
            Select this node
          </Button>
        </View>
      </LinearGradientBottomWrapper>
    </SafeAreaView>
  )
}

export default StakeNodeDetails
