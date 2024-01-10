import React from 'react'
import { BottomSheet } from 'components/BottomSheet'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { useNavigation } from '@react-navigation/native'

function AnalyticsConsentBottomSheet(): JSX.Element {
  const navigation = useNavigation()

  function handleDone(): void {
    navigation.goBack()
  }

  return (
    <BottomSheet onClose={handleDone}>
      <AnalyticsConsent onDone={handleDone} />
    </BottomSheet>
  )
}

export default AnalyticsConsentBottomSheet
