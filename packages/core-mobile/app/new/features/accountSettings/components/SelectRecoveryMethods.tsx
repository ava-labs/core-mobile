import React from 'react'
import { SxProp, Text, View } from '@avalabs/k2-alpine'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { useRegisteredRecoveryMethods } from 'features/onboarding/hooks/useRegisteredRecoveryMethods'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { MFA } from 'seedless/types'

export const SelectRecoveryMethods = ({
  mfaMethods,
  onSelectMfa,
  sx
}: {
  mfaMethods: MFA[]
  onSelectMfa: (type: RecoveryMethod) => void
  sx?: SxProp
}): JSX.Element => {
  const registeredRecoveryMethods = useRegisteredRecoveryMethods(mfaMethods)

  return (
    <View sx={sx}>
      <View sx={{ marginBottom: 24 }}>
        <Text variant="heading3">Verify Recovery Methods</Text>
        <Text variant="body1" sx={{ color: '$textPrimary', marginVertical: 8 }}>
          Verify your recovery method(s) to continue.
        </Text>
      </View>
      <RecoveryMethodList
        data={registeredRecoveryMethods}
        onPress={onSelectMfa}
      />
    </View>
  )
}
