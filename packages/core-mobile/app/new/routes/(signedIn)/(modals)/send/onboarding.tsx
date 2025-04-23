import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { Icons } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useRouter } from 'expo-router'

const SendOnboardingScreen = (): JSX.Element => {
  const { replace } = useRouter()

  const handlePressNext = useCallback(() => {
    replace('send/recentContacts')
  }, [replace])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Bridge, size: 60 }}
      title={`Send tokens to an address\nor contact`}
      subtitle={`Send tokens to any address or contact\non a given network`}
      viewOnceKey={ViewOnceKey.SEND_ONBOARDING}
      onPressNext={handlePressNext}
    />
  )
}

export default SendOnboardingScreen
