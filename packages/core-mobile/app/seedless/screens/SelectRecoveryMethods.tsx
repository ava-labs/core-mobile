import React from 'react'
import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RootStackScreenProps } from 'navigation/types'
import PasskeyService from 'services/passkey/PasskeyService'
import Logger from 'utils/Logger'
import { showSimpleToast } from 'components/Snackbar'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'
import useVerifyMFA from 'seedless/hooks/useVerifyMFA'
import SeedlessService from 'seedless/services/SeedlessService'
import { Card } from '../components/Card'

type SelectRecoveryMethodsScreenProps = RootStackScreenProps<
  typeof AppNavigation.Root.SelectRecoveryMethods
>

export const SelectRecoveryMethods = (): JSX.Element => {
  const { getParent } =
    useNavigation<SelectRecoveryMethodsScreenProps['navigation']>()
  const {
    theme: { colors }
  } = useTheme()
  const { mfaMethods, onAccountVerified, onVerifyFido, onVerifyTotpCode } =
    useRoute<SelectRecoveryMethodsScreenProps['route']>().params
  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )
  const { verifyTotp } = useVerifyMFA(SeedlessService.sessionManager)

  const handleTotp = async (): Promise<void> => {
    if (isSeedlessMfaAuthenticatorBlocked) {
      showSimpleToast('Authenticator is not available at the moment')
    } else {
      verifyTotp({
        onVerifyCode: onVerifyTotpCode,
        onVerifySuccess: () => {
          getParent()?.goBack()
          onAccountVerified(true)
          AnalyticsService.capture('SeedlessMfaVerified', {
            type: 'Authenticator'
          })
        }
      })
    }
  }

  const handleFido = async (): Promise<void> => {
    if (PasskeyService.isSupported === false) {
      showSimpleToast('Passkey/Yubikey is not supported on this device')
      return
    }

    if (isSeedlessMfaPasskeyBlocked && isSeedlessMfaYubikeyBlocked) {
      showSimpleToast('AuthenPasskey/Yubikey is not available at the moment')
    }

    showOwl()

    try {
      await onVerifyFido()

      AnalyticsService.capture('SeedlessMfaVerified', { type: 'Fido' })

      getParent()?.goBack()
      onAccountVerified(true)
    } catch (e) {
      Logger.error('passkey authentication failed', e)
      showSimpleToast('Unable to authenticate')
    } finally {
      hideOwl()
    }
  }

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
              onPress={handleTotp}
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
              onPress={handleFido}
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
