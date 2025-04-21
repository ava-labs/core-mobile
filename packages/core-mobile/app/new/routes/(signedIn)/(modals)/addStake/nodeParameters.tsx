import React, { useCallback } from 'react'
import { Button, SafeAreaView, ScrollView, View } from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { useLocalSearchParams } from 'expo-router'
import { NodeParameterWidget } from 'features/stake/components/NodeParameterWidget'
import { useSharedValue } from 'react-native-reanimated'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const StakeNodeParameter = (): JSX.Element => {
  const { navigate } = useDebouncedRouter()

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

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerSx={{ padding: 16, paddingTop: 0 }}>
        <ScreenHeader title="Choose the parameters for your staking node" />
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
      </ScrollView>
      <View
        sx={{
          padding: 16,
          gap: 16,
          backgroundColor: '$surfacePrimary'
        }}>
        <Button type="primary" size="large" onPress={handlePressNext}>
          Next
        </Button>
      </View>
    </SafeAreaView>
  )
}

const DEFAULT_MIN_UPTIME = 99
const DEFAULT_MAX_DELEGATION_FEE = 3

export default StakeNodeParameter
