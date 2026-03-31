import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { Icons } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useLocalSearchParams, useRouter } from 'expo-router'

export const SwapOnboardingScreen = (): JSX.Element => {
  const { replace } = useRouter()
  const params = useLocalSearchParams<{
    initialTokenIdFrom?: string
    initialTokenIdTo?: string
    initialFromCaip2Id?: string
    initialToCaip2Id?: string
  }>()

  const handlePressNext = useCallback(() => {
    replace({
      pathname: '/swap/swap',
      params
    })
  }, [replace, params])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Compare, size: 75 }}
      title={`Swap tokens across any token pair`}
      subtitle={`Directly exchange any token for another token, such as USDC for AVAX`}
      viewOnceKey={ViewOnceKey.SWAP_ONBOARDING}
      onPressNext={handlePressNext}
    />
  )
}
