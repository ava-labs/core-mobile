import {
  Avatar,
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
import { ScrollScreen } from 'common/components/ScrollScreen'
import { VisibilityBarButton } from 'common/components/VisibilityBarButton'
import { useAvatar } from 'common/hooks/useAvatar'
import { useDeleteWallet } from 'common/hooks/useDeleteWallet'
import { showSnackbar } from 'common/utils/toast'
import { Space } from 'common/components/Space'
import { useRouter } from 'expo-router'
import { About } from 'features/accountSettings/components/About'
import { AccountList } from 'features/accountSettings/components/AcccountList'
import { AppAppearance } from 'features/accountSettings/components/AppAppearance'
import { UserPreferences } from 'features/accountSettings/components/UserPreferences'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectContacts } from 'store/addressBook'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import {
  selectIsPrivacyModeEnabled,
  togglePrivacyMode
} from 'store/settings/securityPrivacy'
import { useCoreBrowser } from 'common/hooks/useCoreBrowser'

const AccountSettingsScreen = (): JSX.Element => {
  const { deleteWallet } = useDeleteWallet()
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const contacts = useSelector(selectContacts)
  const { navigate, back } = useRouter()
  const { openUrl } = useCoreBrowser()

  const { avatar } = useAvatar()

  const renderHeaderRight = useCallback(() => {
    return (
      <VisibilityBarButton
        isModal
        isPrivacyModeEnabled={isPrivacyModeEnabled}
        onPress={() => dispatch(togglePrivacyMode())}
      />
    )
  }, [isPrivacyModeEnabled, dispatch])

  const goToSelectAvatar = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/selectAvatar')
  }, [navigate])

  const goToAppAppearance = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/selectAppearance')
  }, [navigate])

  const goToCurrency = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/selectCurrency')
  }, [navigate])

  const goToNotificationPreferences = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/notificationPreferences')
  }, [navigate])

  const goToSecurityPrivacy = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/securityAndPrivacy')
  }, [navigate])

  const onTestnetChange = (value: boolean): void => {
    AnalyticsService.capture(
      value ? 'DeveloperModeEnabled' : 'DeveloperModeDisabled'
    )
    dispatch(toggleDeveloperMode())
    showSnackbar('Testnet mode is now ' + (value ? 'on' : 'off'))
  }

  const handlePressAboutItem = useCallback(
    ({ url, title }: { url: string; title: string }) => {
      back()
      openUrl({ url, title })
    },
    [openUrl, back]
  )

  return (
    <ScrollScreen
      isModal
      navigationTitle="Account settings"
      renderHeaderRight={renderHeaderRight}
      testID="settings_scroll_view"
      contentContainerStyle={{
        paddingTop: 16
      }}>
      <View sx={{ gap: 48, marginTop: 16 }}>
        <View
          sx={{
            alignItems: 'center'
          }}>
          <TouchableOpacity
            onPress={goToSelectAvatar}
            disabled={isDeveloperMode}>
            <Avatar
              testID={isDeveloperMode ? 'testnet_avatar' : 'mainnet_avatar'}
              size={150}
              source={avatar.source}
              hasLoading={false}
              isDeveloperMode={isDeveloperMode}
            />
          </TouchableOpacity>
        </View>

        <AccountList />

        <View sx={{ gap: 24, paddingHorizontal: 16 }}>
          <View sx={{ gap: 12 }}>
            {/* Testnet mode */}
            <GroupList
              data={[
                {
                  title: 'Testnet mode',
                  value: (
                    <Toggle
                      testID={
                        isDeveloperMode ? 'testnet_enabled' : 'testnet_disabled'
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
                    // @ts-ignore TODO: make routes typesafe
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
                    // @ts-ignore TODO: make routes typesafe
                    onPress: () => navigate('/accountSettings/manageNetworks')
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
            />
            <UserPreferences
              selectNotificationPreferences={goToNotificationPreferences}
              selectSecurityPrivacy={goToSecurityPrivacy}
            />
            <About onPressItem={handlePressAboutItem} />
          </View>
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
                  {
                    text: 'Cancel'
                  },
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

        {/* Footer */}
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
      </View>
    </ScrollScreen>
  )
}

export default AccountSettingsScreen
