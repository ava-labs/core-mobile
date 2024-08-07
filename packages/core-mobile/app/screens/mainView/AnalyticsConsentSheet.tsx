import React from 'react'
import AnalyticsConsent from 'screens/onboarding/AnalyticsConsent'
import { useNavigation } from '@react-navigation/native'
import { Sheet } from 'components/Sheet'
import { useAnalyticsConsent } from 'hooks/useAnalyticsConsent'

function AnalyticsConsentSheet(): JSX.Element {
  const navigation = useNavigation()
  const { reject } = useAnalyticsConsent()

  function handleDone(): void {
    navigation.goBack()
  }

  function handleClose(): void {
    // when user close the sheet, we assume they rejected
    reject()

    navigation.goBack()
  }

  return (
    <Sheet title={'Unlock Airdrops'} onClose={handleClose}>
      <AnalyticsConsent onDone={handleDone} />
    </Sheet>
  )
}

export default AnalyticsConsentSheet
