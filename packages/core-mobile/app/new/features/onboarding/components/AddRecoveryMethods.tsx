import React from 'react'
import { View, Button, ScrollView } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { OidcAuth } from 'features/onboarding/types/types'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import ScreenHeader from 'common/components/ScreenHeader'

export const AddRecoveryMethods = ({
  selectedMethod,
  setSelectedMethod,
  oidcAuth,
  availableRecoveryMethods,
  allowsUserToAddLater,
  onNext,
  onSkip
}: {
  selectedMethod?: RecoveryMethod
  setSelectedMethod: (method: RecoveryMethod) => void
  oidcAuth?: OidcAuth
  availableRecoveryMethods: RecoveryMethod[]
  allowsUserToAddLater: boolean
  onNext: () => void
  onSkip: () => void
}): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <ScrollView
        sx={{
          flex: 1,
          paddingTop: 25,
          paddingHorizontal: 16
        }}
        contentContainerSx={{ gap: 40 }}>
        <ScreenHeader
          title="Add a recovery method"
          description="Add recovery methods to securely restore access in case you lose
            your credentials."
        />
        <RecoveryMethodList
          selectedMethod={selectedMethod}
          data={availableRecoveryMethods}
          onPress={setSelectedMethod}
        />
      </ScrollView>
      <View sx={{ padding: 16, gap: 16 }}>
        <Button
          type="primary"
          size="large"
          onPress={onNext}
          disabled={availableRecoveryMethods.length === 0}>
          Next
        </Button>
        {oidcAuth === undefined && allowsUserToAddLater && (
          <Button type="tertiary" size="large" onPress={onSkip}>
            Skip
          </Button>
        )}
      </View>
    </BlurredBarsContentLayout>
  )
}
