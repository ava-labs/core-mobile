import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Button, GroupList, GroupListItem, Tooltip } from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { copyToClipboard } from 'common/utils/clipboard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useGetValidatorByNodeId } from 'hooks/earn/useGetValidatorByNodeId'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { getAvailableDelegationWeight } from 'services/earn/utils'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { truncateNodeId } from 'utils/Utils'

const StakeNodeDetails = (): JSX.Element => {
  const { navigate } = useRouter()

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

  const renderHeader = useCallback(() => {
    return <GroupList data={details} />
  }, [details])

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handlePressNext}>
        Select this node
      </Button>
    )
  }, [handlePressNext])

  return (
    <ScrollViewScreenTemplate
      isModal
      title="Node details"
      renderFooter={renderFooter}
      renderHeader={renderHeader}
      contentContainerStyle={{ padding: 16 }}>
      <GroupList data={details} />
    </ScrollViewScreenTemplate>
  )
}

export default StakeNodeDetails
