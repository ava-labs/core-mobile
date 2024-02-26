import React, { useCallback, useEffect } from 'react'
import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RootStackScreenProps } from 'navigation/types'
import { MFA } from 'seedless/types'
import { BackButton } from 'components/BackButton'
import { Card } from '../components/Card'

type SelectRecoveryMethodsScreenProps = RootStackScreenProps<
  typeof AppNavigation.Root.SelectRecoveryMethods
>

export const SelectRecoveryMethods = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { mfaMethods, onMFASelected, onBack } =
    useRoute<SelectRecoveryMethodsScreenProps['route']>().params
  const { goBack, setOptions } = useNavigation()

  const handleSelectMFA = (mfa: MFA): void => {
    goBack()
    onMFASelected(mfa)
  }

  const handlePressBack = useCallback((): void => {
    goBack()
    onBack?.()
  }, [goBack, onBack])

  useEffect(() => {
    // eslint-disable-next-line react/no-unstable-nested-components
    setOptions({ headerLeft: () => <BackButton onPress={handlePressBack} /> })
  }, [setOptions, handlePressBack])

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Verify Recovery Methods</Text>
      <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
        Verify your recovery method(s) to continue.
      </Text>
      {mfaMethods.map((mfa, i) => {
        if (mfa.type === 'totp') {
          return (
            <Card
              onPress={() => handleSelectMFA(mfa)}
              icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
              title="Authenticator"
              body="Use your authenticator app as your recovery method."
              showCaret
              key={i}
            />
          )
        } else if (mfa.type === 'fido') {
          return (
            <Card
              onPress={() => handleSelectMFA(mfa)}
              icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
              title={mfa.name}
              body="Use your Passkey (or YubiKey) as your recovery method."
              showCaret
              key={i}
            />
          )
        }

        return null
      })}
    </View>
  )
}
