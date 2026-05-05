import {
  Avatar,
  Button,
  GroupList,
  Icons,
  Logos,
  showAlert,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { AppUpdateBanner } from 'common/components/AppUpdateBanner'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Space } from 'common/components/Space'
import { VisibilityBarButton } from 'common/components/VisibilityBarButton'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useAppUpdateStatus } from 'common/hooks/useAppUpdateStatus'
import { useAvatar } from 'common/hooks/useAvatar'
import { useDeleteWallet } from 'common/hooks/useDeleteWallet'
import useInAppBrowser from 'common/hooks/useInAppBrowser'
import { useStoredBiometrics } from 'common/hooks/useStoredBiometrics'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import { About } from 'features/accountSettings/components/About'
import { AppAppearance } from 'features/accountSettings/components/AppAppearance'
import { Support } from 'features/accountSettings/components/Support'
import { UserPreferences } from 'features/accountSettings/components/UserPreferences'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { selectContacts } from 'store/addressBook'
import { selectIsSettingsAdvancedBlocked } from 'store/posthog'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import {
  selectIsPrivacyModeEnabled,
  selectLockWalletWithPIN,
  setLockWalletWithPIN,
  togglePrivacyMode
} from 'store/settings/securityPrivacy'
import { onAppLocked, setIsLocked, setWalletState } from 'store/app/slice'
import { WalletState } from 'store/app/types'
import { manualLockStore } from 'features/accountSettings/store'
import { isLimitedMode } from 'utils/limitedMode'
import { PoweredByAvalanche } from 'common/components/PoweredByAvalanche'
import BiometricsSDK from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const AccountSettingsScreen = (): JSX.Element => {
  const { deleteWallet } = useDeleteWallet()
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const contacts = useSelector(selectContacts)
  const isSettingsAdvancedBlocked = useSelector(selectIsSettingsAdvancedBlocked)
  const { navigate } = useRouter()
  const { avatar } = useAvatar()
  const appUpdateStatus = useAppUpdateStatus()
  const { openUrl } = useInAppBrowser()

  // Security & recovery state — used by the Hello UI Settings layout in
  // limited mode. Hooked here directly so users get all the controls in
  // one screen instead of drilling into Security & privacy.
  const lockWalletWithPIN = useSelector(selectLockWalletWithPIN)
  const wallet = useActiveWallet()
  const {
    biometricType,
    isBiometricAvailable,
    useBiometrics,
    setUseBiometrics
  } = useStoredBiometrics()

  const handleSwitchBiometric = useCallback(
    (value: boolean): void => {
      setUseBiometrics(value)
      if (value) {
        navigate('/accountSettings/biometricVerifyPin')
      } else {
        BiometricsSDK.disableBiometry().catch(Logger.error)
      }
    },
    [navigate, setUseBiometrics]
  )

  const handleToggleLockWalletWithPIN = useCallback(
    (value: boolean): void => {
      if (value === false) {
        showAlert({
          title: 'Do you really want to disable the PIN code?',
          description:
            'This will remove the PIN requirement when leaving the app and keeping it open in the background.\n\nHowever, pin will be required if the app is closed completely',
          buttons: [
            { text: 'Cancel' },
            {
              text: 'Disable',
              onPress: () => {
                dispatch(setLockWalletWithPIN(value))
              }
            }
          ]
        })
      } else {
        dispatch(setLockWalletWithPIN(value))
      }
    },
    [dispatch]
  )

  const goToChangePin = useCallback(() => {
    navigate('/accountSettings/verifyChangePin')
  }, [navigate])

  const goToShowRecoveryPhrase = useCallback(() => {
    if (wallet.type === WalletType.SEEDLESS) {
      navigate('/accountSettings/seedlessExportPhrase')
      return
    }
    navigate('/accountSettings/recoveryPhraseVerifyPin')
  }, [navigate, wallet.type])

  const goToRecoveryMethods = useCallback(() => {
    navigate('/accountSettings/addRecoveryMethods')
  }, [navigate])

  const showRecoverySection =
    wallet.type === WalletType.MNEMONIC || wallet.type === WalletType.SEEDLESS

  const handleLockWallet = useCallback((): void => {
    manualLockStore.setState({ wasManuallyLocked: true })
    dispatch(setIsLocked(true))
    dispatch(onAppLocked())
    dispatch(setWalletState(WalletState.INACTIVE))
  }, [dispatch])

  const renderHeaderRight = useCallback(() => {
    return (
      <VisibilityBarButton
        isPrivacyModeEnabled={isPrivacyModeEnabled}
        onPress={() => dispatch(togglePrivacyMode())}
      />
    )
  }, [isPrivacyModeEnabled, dispatch])

  const goToSelectAvatar = useCallback(() => {
    navigate('/accountSettings/selectAvatar')
  }, [navigate])

  const goToAppAppearance = useCallback(() => {
    navigate('/accountSettings/selectAppearance')
  }, [navigate])

  const goToSelectAppIcon = useCallback(() => {
    navigate('/accountSettings/selectAppIcon')
  }, [navigate])

  const goToCurrency = useCallback(() => {
    navigate('/accountSettings/selectCurrency')
  }, [navigate])

  const goToNotificationPreferences = useCallback(() => {
    navigate('/accountSettings/notificationPreferences')
  }, [navigate])

  const goToSecurityPrivacy = useCallback(() => {
    navigate('/accountSettings/securityAndPrivacy')
  }, [navigate])

  const onTestnetChange = (value: boolean): void => {
    showSnackbar('Testnet mode is now ' + (value ? 'on' : 'off'))

    AnalyticsService.capture(
      value ? 'DeveloperModeEnabled' : 'DeveloperModeDisabled'
    )

    dispatch(toggleDeveloperMode())
  }

  const handlePressAboutItem = useCallback(
    ({ url }: { url: string }) => {
      openUrl(url)
    },
    [openUrl]
  )

  const renderAppUpdateBanner = useCallback(() => {
    // Hide the update banner in limited mode — the demo build is not meant
    // to be updated through the standard channels.
    if (isLimitedMode) return undefined
    if (appUpdateStatus?.needsUpdate === true) return <AppUpdateBanner />

    return undefined
  }, [appUpdateStatus])

  // Hello UI Settings layout — focused on the most important controls
  // (lock + recovery) presented as plain sectioned rows. Lock wallet is
  // an outline pill at the bottom; Delete wallet is a red text-only
  // affordance below it. Replaces the avatar-led legacy layout.
  if (isLimitedMode) {
    const handleConfirmDelete = (): void => {
      showAlert({
        title: 'Are you sure you want to delete your wallet?',
        description:
          'Removing the account will delete all local information stored on this device. Your assets will remain on chain.',
        buttons: [
          { text: 'Cancel' },
          {
            text: 'I understand, continue',
            style: 'destructive',
            onPress: deleteWallet
          }
        ]
      })
    }

    const renderLimitedFooter = (): JSX.Element => (
      <View sx={{ gap: 12, alignItems: 'center' }}>
        <Button
          type="secondary"
          size="large"
          style={{
            alignSelf: 'stretch',
            borderWidth: 2,
            borderColor: colors.$textPrimary
          }}
          textStyle={{
            fontFamily: 'Rookery-Bold',
            fontSize: 16,
            lineHeight: 22
          }}
          onPress={handleLockWallet}>
          Lock wallet
        </Button>
        <TouchableOpacity
          testID="delete_wallet_btn"
          onPress={handleConfirmDelete}
          hitSlop={8}>
          <Text
            variant="body1"
            sx={{
              color: colors.$textDanger,
              fontFamily: 'Rookery-Bold',
              lineHeight: 22
            }}>
            Delete wallet
          </Text>
        </TouchableOpacity>
        <View testID="settings_footer" sx={{ marginTop: 16 }}>
          <PoweredByAvalanche />
        </View>
      </View>
    )

    return (
      <ScrollScreen
        isModal
        title="Settings"
        navigationTitle="Settings"
        renderHeaderRight={renderHeaderRight}
        renderFooter={renderLimitedFooter}
        contentContainerStyle={{ padding: 16 }}>
        <View sx={{ gap: 32, marginTop: 24 }}>
          <SettingsSection title="Lock">
            <SettingsRow
              title="Require PIN immediately"
              accessory={
                <Toggle
                  testID={lockWalletWithPIN ? 'pin_enabled' : 'pin_disabled'}
                  value={lockWalletWithPIN}
                  onValueChange={() =>
                    handleToggleLockWalletWithPIN(!lockWalletWithPIN)
                  }
                />
              }
            />
            <SettingsRow title="Change PIN" onPress={goToChangePin} />
            {isBiometricAvailable && (
              <SettingsRow
                title={`Use ${biometricType}`}
                accessory={
                  <Toggle
                    value={useBiometrics}
                    onValueChange={handleSwitchBiometric}
                  />
                }
              />
            )}
          </SettingsSection>

          {showRecoverySection && (
            <SettingsSection title="Recovery">
              <SettingsRow
                title="Show recovery phrase"
                onPress={goToShowRecoveryPhrase}
              />
              {wallet.type === WalletType.SEEDLESS && (
                <SettingsRow
                  title="Recovery methods"
                  onPress={goToRecoveryMethods}
                />
              )}
            </SettingsSection>
          )}
        </View>
      </ScrollScreen>
    )
  }

  return (
    <ScrollScreen
      isModal
      navigationTitle="Settings"
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{
        paddingTop: 16
      }}>
      <View sx={{ gap: isLimitedMode ? 24 : 60, marginTop: 16 }}>
        <View
          sx={{
            alignItems: 'center'
          }}>
          <TouchableOpacity
            onPress={goToSelectAvatar}
            disabled={isDeveloperMode}>
            <Avatar
              testID={isDeveloperMode ? 'testnet_avatar' : 'mainnet_avatar'}
              size={isLimitedMode ? 80 : 150}
              source={avatar.source}
              hasLoading={false}
              isDeveloperMode={isDeveloperMode}
            />
          </TouchableOpacity>
        </View>

        <View sx={{ gap: 24, paddingHorizontal: 16 }}>
          {renderAppUpdateBanner()}
          <View sx={{ gap: 12 }}>
            {!isSettingsAdvancedBlocked && (
              <>
                {/* Testnet mode */}
                <GroupList
                  data={[
                    {
                      title: 'Testnet mode',
                      disableRowAccessibility: true,
                      value: (
                        <Toggle
                          testID={
                            isDeveloperMode
                              ? 'testnet_enabled'
                              : 'testnet_disabled'
                          }
                          onValueChange={onTestnetChange}
                          value={isDeveloperMode}
                        />
                      )
                    }
                  ]}
                  titleSx={{
                    fontSize: 16,
                    lineHeight: 22,
                    fontFamily: 'Inter-Regular'
                  }}
                  valueSx={{ fontSize: 16, lineHeight: 22 }}
                  separatorMarginRight={16}
                />
                {/* Contacts */}
                <View>
                  <Space y={12} />
                  <GroupList
                    data={[
                      {
                        title: 'Contacts',
                        onPress: () => navigate('/accountSettings/addressBook'),
                        value: (
                          <Text
                            variant="body2"
                            sx={{
                              color: colors.$textSecondary,
                              fontSize: 16,
                              lineHeight: 22,
                              marginLeft: 9
                            }}>
                            {Object.keys(contacts).length}
                          </Text>
                        )
                      }
                    ]}
                    titleSx={{
                      fontSize: 16,
                      lineHeight: 22,
                      fontFamily: 'Inter-Regular'
                    }}
                    valueSx={{ fontSize: 16, lineHeight: 22 }}
                    separatorMarginRight={16}
                  />
                </View>
                <View>
                  <GroupList
                    data={[
                      {
                        title: 'Networks',
                        onPress: () =>
                          navigate('/accountSettings/manageNetworks')
                      }
                    ]}
                    titleSx={{
                      fontSize: 16,
                      lineHeight: 22,
                      fontFamily: 'Inter-Regular'
                    }}
                    valueSx={{ fontSize: 16, lineHeight: 22 }}
                    separatorMarginRight={16}
                  />
                </View>
                <AppAppearance
                  selectAppAppearance={goToAppAppearance}
                  selectCurrency={goToCurrency}
                  selectAppIcon={goToSelectAppIcon}
                />
              </>
            )}
            {isLimitedMode ? (
              <GroupList
                data={[
                  {
                    title: 'Appearance',
                    onPress: goToAppAppearance
                  },
                  {
                    title: 'Security & privacy',
                    onPress: goToSecurityPrivacy
                  },
                  {
                    title: 'Lock wallet',
                    onPress: handleLockWallet
                  },
                  {
                    title: (
                      <Text
                        variant="body1"
                        sx={{ color: colors.$textDanger, lineHeight: 22 }}>
                        Delete wallet
                      </Text>
                    ),
                    onPress: () => {
                      showAlert({
                        title: 'Are you sure you want to delete your wallet?',
                        description:
                          'Removing the account will delete all local information stored on this device. Your assets will remain on chain.',
                        buttons: [
                          { text: 'Cancel' },
                          {
                            text: 'I understand, continue',
                            style: 'destructive',
                            onPress: deleteWallet
                          }
                        ]
                      })
                    }
                  }
                ]}
                titleSx={{
                  fontSize: 16,
                  lineHeight: 22,
                  fontFamily: 'Inter-Regular'
                }}
                separatorMarginRight={16}
              />
            ) : (
              <UserPreferences
                selectNotificationPreferences={
                  isSettingsAdvancedBlocked
                    ? undefined
                    : goToNotificationPreferences
                }
                selectSecurityPrivacy={goToSecurityPrivacy}
              />
            )}
            {!isSettingsAdvancedBlocked && (
              <>
                <Support onPressItem={handlePressAboutItem} />
                <About onPressItem={handlePressAboutItem} />
              </>
            )}
          </View>
        </View>

        {!isLimitedMode && (
          <View sx={{ gap: 12, paddingHorizontal: 16 }}>
            <TouchableOpacity
              sx={{
                alignItems: 'center',
                backgroundColor: colors.$surfaceSecondary,
                borderRadius: 12,
                padding: 14
              }}
              onPress={handleLockWallet}>
              <Text
                variant="body1"
                sx={{ color: colors.$textPrimary, lineHeight: 20 }}>
                Lock wallet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              sx={{
                alignItems: 'center',
                backgroundColor: colors.$surfaceSecondary,
                borderRadius: 12,
                padding: 14
              }}
              onPress={() => {
                showAlert({
                  title: 'Are you sure you want to delete your wallet?',
                  description:
                    'Removing the account will delete all local information stored on this device. Your assets will remain on chain.',
                  buttons: [
                    { text: 'Cancel' },
                    {
                      text: 'I understand, continue',
                      style: 'destructive',
                      onPress: deleteWallet
                    }
                  ]
                })
              }}>
              <Text
                variant="body1"
                sx={{ color: colors.$textDanger, lineHeight: 20 }}>
                Delete wallet
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        {isLimitedMode ? (
          <View
            testID="settings_footer"
            sx={{ alignItems: 'center', paddingBottom: 24 }}>
            <PoweredByAvalanche />
          </View>
        ) : (
          <View
            testID="settings_footer"
            sx={{ gap: 8, alignItems: 'center', paddingBottom: 24 }}>
            <Logos.AppIcons.Core
              color={colors.$textSecondary}
              width={79}
              height={22}
            />
            <Icons.Custom.AvalabsTrademark color={colors.$textSecondary} />
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}

export default AccountSettingsScreen

// --- Hello UI Settings building blocks ---------------------------------
// Plain sectioned list — section header (label + thin divider line) on
// top, lightweight rows underneath. Used only by the limited-mode
// Settings layout above; default app keeps the GroupList-card pattern.

const SettingsSection = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View sx={{ gap: 12 }}>
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          variant="caption"
          sx={{
            color: colors.$textSecondary,
            fontFamily: 'Rookery-Regular',
            fontSize: 13,
            lineHeight: 16
          }}>
          {title}
        </Text>
        <View
          sx={{ flex: 1, height: 1, backgroundColor: colors.$borderPrimary }}
        />
      </View>
      <View sx={{ gap: 8 }}>{children}</View>
    </View>
  )
}

const SettingsRow = ({
  title,
  accessory,
  onPress
}: {
  title: string
  accessory?: React.ReactNode
  onPress?: () => void
}): JSX.Element => {
  const content = (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 44,
        paddingVertical: 8
      }}>
      <Text
        variant="body1"
        sx={{
          fontFamily: 'Rookery-Medium',
          fontSize: 16,
          lineHeight: 22,
          color: '$textPrimary'
        }}>
        {title}
      </Text>
      {accessory}
    </View>
  )

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>
  }
  return content
}
