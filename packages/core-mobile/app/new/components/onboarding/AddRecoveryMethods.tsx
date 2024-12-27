import React from 'react'
import { View, Text, Button } from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import {
  RecoveryMethod,
  RecoveryMethods
} from 'new/hooks/useAvailableRecoveryMethods'
import { OidcAuth } from 'new/types'
import { RecoveryMethodList } from '../../components/RecoveryMethodList'

export const AddRecoveryMethods = ({
  selectedMethod,
  setSelectedMethod,
  oidcAuth,
  availableRecoveryMethods,
  allowsUserToAddLater,
  onNext,
  onSkip
}: {
  selectedMethod?: RecoveryMethods
  setSelectedMethod: (method: RecoveryMethods) => void
  oidcAuth?: OidcAuth
  availableRecoveryMethods: RecoveryMethod[]
  allowsUserToAddLater: boolean
  onNext: () => void
  onSkip: () => void
}): JSX.Element => {
  return (
    <BlurredBarsContentLayout>
      <View
        sx={{
          flex: 1,
          paddingTop: 25,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text variant="heading2" sx={{ marginBottom: 8 }}>
            Add a recovery method
          </Text>
          <Text variant="body1" sx={{ marginBottom: 40 }}>
            Add recovery methods to securely restore access in case you lose
            your credentials.
          </Text>
          <RecoveryMethodList
            selectedMethod={selectedMethod}
            data={availableRecoveryMethods}
            onPress={setSelectedMethod}
          />
        </View>
        <View sx={{ gap: 16, marginBottom: 36 }}>
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
      </View>
    </BlurredBarsContentLayout>
  )
}
