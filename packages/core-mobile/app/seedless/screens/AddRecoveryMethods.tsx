import {
  Button,
  Icons,
  ScrollView,
  Text,
  View,
  useTheme
} from '@avalabs/k2-mobile'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RecoveryMethodsScreenProps } from 'navigation/types'
import React from 'react'
import SeedlessService from 'seedless/services/SeedlessService'
import PasskeyService from 'services/passkey/PasskeyService'
import Logger from 'utils/Logger'
import { FidoType } from 'services/passkey/types'
import { showSimpleToast } from 'components/Snackbar'
import { hideLogo, showLogo } from 'components/GlobalLogoLoader'
import { useSelector } from 'react-redux'
import {
  selectIsSeedlessMfaAuthenticatorBlocked,
  selectIsSeedlessMfaPasskeyBlocked,
  selectIsSeedlessMfaYubikeyBlocked
} from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'
import useSeedlessManageMFA from 'seedless/hooks/useSeedlessManageMFA'
import { Card } from '../components/Card'

type AddRecoveryMethodsScreenProps = RecoveryMethodsScreenProps<
  typeof AppNavigation.RecoveryMethods.AddRecoveryMethods
>

export const AddRecoveryMethods = (): JSX.Element => {
  const { navigate, getParent } =
    useNavigation<AddRecoveryMethodsScreenProps['navigation']>()
  const {
    theme: { colors }
  } = useTheme()
  const { mfas, oidcAuth, onAccountVerified, allowsUserToAddLater } =
    useRoute<AddRecoveryMethodsScreenProps['route']>().params
  const isSeedlessMfaPasskeyBlocked = useSelector(
    selectIsSeedlessMfaPasskeyBlocked
  )
  const isSeedlessMfaAuthenticatorBlocked = useSelector(
    selectIsSeedlessMfaAuthenticatorBlocked
  )
  const isSeedlessMfaYubikeyBlocked = useSelector(
    selectIsSeedlessMfaYubikeyBlocked
  )
  const { fidoRegisterInit } = useSeedlessManageMFA()

  const canAddAuthenticator =
    (mfas ?? []).some(mfa => mfa.type === 'totp') === false

  const handleAuthenticator = (): void => {
    navigate(AppNavigation.RecoveryMethods.AuthenticatorSetup, {
      oidcAuth,
      onAccountVerified
    })

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

    showLogo()

    try {
      const withSecurityKey = fidoType === FidoType.YUBI_KEY

      fidoRegisterInit(passkeyName, async challenge => {
        const credential = await PasskeyService.createCredential(
          challenge.options,
          withSecurityKey
        )

        await challenge.answer(credential)

        AnalyticsService.capture('SeedlessMfaAdded')

        if (oidcAuth) {
          await SeedlessService.session.approveFido(
            oidcAuth.oidcToken,
            oidcAuth.mfaId,
            withSecurityKey
          )

          AnalyticsService.capture('SeedlessMfaVerified', { type: fidoType })
        }

        getParent()?.goBack()

        onAccountVerified(true)
      })
    } catch (e) {
      Logger.error(`${fidoType} registration failed`, e)
      showSimpleToast(`Unable to register ${fidoType}`)
    } finally {
      hideLogo()
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

  const handleSetupLater = (): void => {
    getParent()?.goBack()

    onAccountVerified(false)
  }

  return (
    <View sx={{ flex: 1 }}>
      <ScrollView contentContainerSx={{ marginHorizontal: 16, flex: 1 }}>
        <Text variant="heading3">Add Recovery Methods</Text>
        <Text variant="body1" sx={{ color: '$neutral50', marginVertical: 8 }}>
          Add <Text variant="heading6">optional</Text> recovery method to
          continue.
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
        {!isSeedlessMfaAuthenticatorBlocked && canAddAuthenticator && (
          <Card
            onPress={handleAuthenticator}
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
      </ScrollView>
      {oidcAuth === undefined && allowsUserToAddLater === true && (
        <View sx={{ padding: 16, marginBottom: 30 }}>
          <Button type="primary" size="xlarge" onPress={handleSetupLater}>
            Set Up Later
          </Button>
        </View>
      )}
    </View>
  )
}
