import {
  Avatar,
  GroupList,
  Icons,
  Logos,
  NavigationTitleHeader,
  showAlert,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation } from '@react-navigation/native'
import { VisibilityBarButton } from 'common/components/VisibilityBarButton'
import { useAvatar } from 'common/hooks/useAvatar'
import { useDeleteWallet } from 'common/hooks/useDeleteWallet'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { showSnackbar } from 'common/utils/toast'
import { Space } from 'components/Space'
import { useRouter } from 'expo-router'
import { About } from 'features/accountSettings/components/About'
import { AccountList } from 'features/accountSettings/components/AcccountList'
import { AppAppearance } from 'features/accountSettings/components/AppAppearance'
import { UserPreferences } from 'features/accountSettings/components/UserPreferences'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useEffect, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, { useSharedValue } from 'react-native-reanimated'
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

const AccountSettingsScreen = (): JSX.Element => {
  const { deleteWallet } = useDeleteWallet()
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const { enabledNetworks } = useNetworks()
  const contacts = useSelector(selectContacts)
  const { navigate } = useRouter()
  const { setOptions } = useNavigation()
  const headerOpacity = useSharedValue(1)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const scrollViewProps = useFadingHeaderNavigation({
    header: <NavigationTitleHeader title={'Settings and accounts'} />,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const { avatar } = useAvatar()

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  const renderHeaderRight = useCallback(() => {
    return (
      <View
        sx={{
          marginTop: 14,
          marginRight: 18
        }}>
        <VisibilityBarButton
          isPrivacyModeEnabled={isPrivacyModeEnabled}
          onPress={() => dispatch(togglePrivacyMode())}
        />
      </View>
    )
  }, [dispatch, isPrivacyModeEnabled])

  useEffect(() => {
    setOptions({
      headerRight: renderHeaderRight
    })
  }, [renderHeaderRight, setOptions])

  const goToSelectAvatar = useCallback(() => {
    navigate('/accountSettings/selectAvatar')
  }, [navigate])

  const goToAppAppearance = useCallback(() => {
    if (isDeveloperMode) {
      showAlert({
        title: 'Testnet mode is on',
        description:
          'Change appearance is not available in testnet mode. Please turn off testnet mode to change appearance.',
        buttons: [
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      })
      return
    }
    navigate('/accountSettings/selectAppearance')
  }, [isDeveloperMode, navigate])

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
    AnalyticsService.capture(
      value ? 'DeveloperModeEnabled' : 'DeveloperModeDisabled'
    )
    dispatch(toggleDeveloperMode())
    showSnackbar('Testnet mode is now ' + (value ? 'on' : 'off'))
  }

  return (
    <ScrollView
      testID="settings_scroll_view"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
      {...scrollViewProps}>
      <View
        sx={{
          paddingHorizontal: 16,
          paddingBottom: 4,
          gap: 48
        }}>
        {/* Header */}
        <View
          sx={{
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <Animated.View
            style={{ opacity: headerOpacity }}
            onLayout={handleHeaderLayout}>
            <TouchableOpacity
              onPress={goToSelectAvatar}
              disabled={isDeveloperMode}
              sx={{ marginTop: 5, height: 150 }}>
              <Avatar
                testID={isDeveloperMode ? 'testnet_avatar' : 'mainnet_avatar'}
                size={150}
                source={avatar.source}
                hasLoading={false}
                isDeveloperMode={isDeveloperMode}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Account list */}
        <AccountList />

        {/* Settings */}
        <View sx={{ gap: 24 }}>
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
                    onPress: () => navigate('/accountSettings/manageNetworks'),
                    value: (
                      <Text
                        variant="body2"
                        sx={{
                          color: colors.$textSecondary,
                          fontSize: 16,
                          lineHeight: 22,
                          marginLeft: 9
                        }}>
                        {enabledNetworks.length}
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
            <AppAppearance
              selectAppAppearance={goToAppAppearance}
              selectCurrency={goToCurrency}
            />
            <UserPreferences
              selectNotificationPreferences={goToNotificationPreferences}
              selectSecurityPrivacy={goToSecurityPrivacy}
            />
            <About />
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
                    text: 'I understand, continue',
                    onPress: deleteWallet
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
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
        <View testID="settings_footer" sx={{ gap: 8, alignItems: 'center' }}>
          <Logos.AppIcons.Core
            color={colors.$textSecondary}
            width={79}
            height={22}
          />
          <Icons.Custom.AvalabsTrademark color={colors.$textSecondary} />
        </View>
      </View>
    </ScrollView>
  )
}

export default AccountSettingsScreen
