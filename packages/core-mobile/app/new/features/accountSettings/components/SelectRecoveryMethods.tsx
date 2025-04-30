import { Loader } from 'common/components/Loader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import React from 'react'
import { MFA } from 'seedless/types'

export const SelectRecoveryMethods = ({
  mfaMethods,
  onSelectMfa,
  isLoading
}: {
  mfaMethods: MFA[]
  onSelectMfa: (type: RecoveryMethod) => void
  isLoading: boolean
}): JSX.Element => {
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  return (
    <ScrollScreen
      title={`Verify recovery\nmethods`}
      navigationTitle="Verify recovery methods"
      subtitle="Verify your recovery method(s) to continue."
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      {isLoading ? (
        <Loader />
      ) : (
        <RecoveryMethodList
          data={registeredRecoveryMethods}
          onPress={onSelectMfa}
        />
      )}
    </ScrollScreen>
  )
}
