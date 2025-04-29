import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { Icons } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useRouter } from 'expo-router'

const SendOnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const handlePressNext = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('collectibleSend/recentContacts')
  }, [navigate])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Send, size: 60 }}
      title={`Send tokens to an address or contact`}
      subtitle={`Send tokens to any address or contact on a given network`}
      viewOnceKey={ViewOnceKey.SEND_ONBOARDING}
      onPressNext={handlePressNext}
    />
  )
}

export default SendOnboardingScreen
