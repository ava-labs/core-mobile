import { Button, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { RecoveryMethodList } from 'features/onboarding/components/RecoveryMethodList'
import { RecoveryMethod } from 'features/onboarding/hooks/useAvailableRecoveryMethods'
import { OidcAuth } from 'features/onboarding/types/types'
import React, { useCallback } from 'react'

export const AddRecoveryMethods = ({
  oidcAuth,
  availableRecoveryMethods,
  allowsUserToAddLater,
  onNext,
  onSkip
}: {
  oidcAuth?: OidcAuth
  availableRecoveryMethods: RecoveryMethod[]
  allowsUserToAddLater: boolean
  onNext: (method: RecoveryMethod) => void
  onSkip: () => void
}): JSX.Element => {
  const renderFooter = useCallback(() => {
    if (oidcAuth === undefined && allowsUserToAddLater) {
      return (
        <Button type="tertiary" size="large" onPress={onSkip}>
          Skip
        </Button>
      )
    }
    return <></>
  }, [oidcAuth, allowsUserToAddLater, onSkip])

  return (
    <ScrollScreen
      title="Add a recovery method"
      subtitle="Add recovery methods to securely restore access in case you lose your credentials."
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View
        style={{
          marginTop: 24
        }}>
        <RecoveryMethodList data={availableRecoveryMethods} onPress={onNext} />
      </View>
    </ScrollScreen>
  )
}
