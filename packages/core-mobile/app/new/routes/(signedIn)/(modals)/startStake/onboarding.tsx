import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { Icons } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useRouter } from 'expo-router'

const StakeOnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handlePressNext = useCallback(() => {
    navigate('startStake/amount')
  }, [navigate])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Psychiatry, size: 60 }}
      title={`Stake your AVAX and\nearn rewards`}
      subtitle={`Lock AVAX in the network for a set period\nof time and generate staking rewards`}
      viewOnceKey={ViewOnceKey.STAKE_ONBOARDING}
      onPressNext={handlePressNext}
    />
  )
}

export default StakeOnboardingScreen
