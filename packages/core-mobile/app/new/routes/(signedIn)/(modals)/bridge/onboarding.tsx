import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { Icons } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useRouter } from 'expo-router'

const BridgeOnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handlePressNext = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('bridge/bridge')
  }, [navigate])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Bridge, size: 60 }}
      title={`Bridge tokens between two networks`}
      subtitle={`Send tokens like USDC between networks such as Avalanche and Ethereum`}
      viewOnceKey={ViewOnceKey.BRIDGE_ONBOARDING}
      onPressNext={handlePressNext}
    />
  )
}

export default BridgeOnboardingScreen
