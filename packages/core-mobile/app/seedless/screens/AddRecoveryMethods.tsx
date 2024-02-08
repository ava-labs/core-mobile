import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React, { useContext } from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import PasskeyService from 'services/passkey/PasskeyService'
import { RecoveryMethodsContext } from 'navigation/onboarding/RecoveryMethodsStack'
import Logger from 'utils/Logger'
import { FidoType } from 'services/passkey/types'
import { showSimpleToast } from 'components/Snackbar'
import { hideOwl, showOwl } from 'components/GlobalOwlLoader'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Card } from '../components/Card'

type AddRecoveryMethodsScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AddRecoveryMethods
>

export const AddRecoveryMethods = (): JSX.Element => {
  const { navigate, goBack } =
    useNavigation<AddRecoveryMethodsScreenProps['navigation']>()
  const {
    theme: { colors }
  } = useTheme()
  const { mfaId, oidcToken } = useContext(RecoveryMethodsContext)
  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )

  const goToAuthenticatorSetup = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup)

    AnalyticsService.capture('SeedlessAddMfa', { type: 'Authenticator' })
  }

  const registerAndAuthenticateFido = async ({
    name,
    fidoType
  }: {
    name?: string
    fidoType: FidoType
  }): Promise<void> => {
    const passkeyName = name && name.length > 0 ? name : fidoType.toString()

    showOwl()

    try {
      const withSecurityKey = fidoType === FidoType.YUBI_KEY

      await SeedlessService.sessionManager.registerFido(
        passkeyName,
        withSecurityKey
      )

      AnalyticsService.capture('SeedlessMfaAdded')

      await SeedlessService.sessionManager.approveFido(
        oidcToken,
        mfaId,
        withSecurityKey
      )

      AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })

      goBack()

      navigate(AppNavigation.Onboard.NameYourWallet)
    } catch (e) {
      Logger.error(`${fidoType} registration failed`, e)
      showSimpleToast(`Unable to register ${fidoType}`)
    } finally {
      hideOwl()
    }
  }

  const handlePasskey = async (): Promise<void> => {
    navigate(AppNavigation.RecoveryMethods.FIDONameInput, {
      title: 'Name Your Passkey',
      description: "Add a Passkey name, so it's easier to find later.",
      inputFieldLabel: 'Passkey Name',
      inputFieldPlaceholder: 'Enter Name',
      onClose: async (name?: string) => {
        registerAndAuthenticateFido({ name, fidoType: FidoType.PASS_KEY })
      }
    })

    AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.PASS_KEY })
  }

  const handleYubikey = async (): Promise<void> => {
    navigate(AppNavigation.RecoveryMethods.FIDONameInput, {
      title: 'Name Your Yubikey',
      description: "Add a Yubikey name, so it's easier to find later.",
      inputFieldLabel: 'Yubikey Name',
      inputFieldPlaceholder: 'Enter Name',
      onClose: async (name?: string) => {
        registerAndAuthenticateFido({ name, fidoType: FidoType.YUBI_KEY })
      }
    })

    AnalyticsService.capture('SeedlessAddMfa', { type: FidoType.YUBI_KEY })
  }

  return (
    <View sx={{ marginHorizontal: 16, flex: 1 }}>
      <Text variant="heading3">Add Recovery Methods</Text>
      <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
        Add <Text variant="heading6">one</Text> recovery method to continue.
      </Text>
      {PasskeyService.isSupported && !isSeedlessMfaPasskeyBlocked && (
        <Card
          onPress={handlePasskey}
          icon={<Icons.Communication.IconKey color={colors.$neutral50} />}
          title="Passkey"
          body="Add a Passkey as a recovery method."
          showCaret
        />
      )}
      {!isSeedlessMfaAuthenticatorBlocked && (
        <Card
          onPress={goToAuthenticatorSetup}
          icon={<Icons.Communication.IconQRCode color={colors.$neutral50} />}
          title="Authenticator"
          body="Add an Authenticator app as a recovery method."
          showCaret
        />
      )}
      {PasskeyService.isSupported && !isSeedlessMfaYubikeyBlocked && (
        <Card
          onPress={handleYubikey}
          icon={<Icons.Device.IconUSB color={colors.$neutral50} />}
          title="YubiKey"
          body="Add a YubiKey as a recovery method."
          showCaret
        />
      )}
    </View>
  )
}
