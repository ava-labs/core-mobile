import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { NodeParameterWidget } from 'features/stake/components/NodeParameterWidget'
import React, { useCallback } from 'react'
import { useSharedValue } from 'react-native-reanimated'

const StakeNodeParameter = (): JSX.Element => {
  const { navigate } = useRouter()

  const { stakeEndTime } = useLocalSearchParams<{
    stakeEndTime: string
  }>()

  const minimumUptime = useSharedValue(DEFAULT_MIN_UPTIME)
  const maximumDelegationFee = useSharedValue(DEFAULT_MAX_DELEGATION_FEE)

  const handlePressNext = useCallback(() => {
    navigate({
      pathname: '/addStake/selectNode',
      params: {
        minUptime: Math.round(minimumUptime.get()),
        maxDelegationFee: Math.round(maximumDelegationFee.get()),
        stakeEndTime
      }
    })
  }, [navigate, minimumUptime, maximumDelegationFee, stakeEndTime])

  const renderFooter = useCallback(() => {
    return (
      <Button type="primary" size="large" onPress={handlePressNext}>
        Next
      </Button>
    )
  }, [handlePressNext])

  return (
    <ScrollScreen
      isModal
      title="Choose the parameters for your staking node"
      navigationTitle="Node parameters"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 12, marginTop: 16 }}>
        <NodeParameterWidget
          title="Minimum uptime"
          value={minimumUptime}
          tooltipMessage="This is a validator's uptime, the minimum threshold for rewards is 80%"
          minimumValue={1}
          maximumValue={99}
        />
        <NodeParameterWidget
          title="Maximum delegation fee"
          value={maximumDelegationFee}
          tooltipMessage="This is a range set by the protocol."
          minimumValue={2}
          maximumValue={20}
        />
      </View>
    </ScrollScreen>
  )
}

const DEFAULT_MIN_UPTIME = 99
const DEFAULT_MAX_DELEGATION_FEE = 3

export default StakeNodeParameter
