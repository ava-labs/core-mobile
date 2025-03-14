import {
  AnimatedText,
  Avatar,
  Icons,
  Logos,
  NavigationTitleHeader,
  ScrollView,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useNavigation, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import Animated, {
  useSharedValue,
  FadeIn,
  LinearTransition
} from 'react-native-reanimated'
import { LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent } from 'react-native'
import { VisibilityBarButton } from 'common/components/VisibilityBarButton'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useTotalBalanceInCurrencyForAccount } from 'common/hooks/useTotalBalanceInCurrency'
import { selectSelectedCurrency } from 'store/settings/currency'
import { AccountList } from 'features/accountSettings/components/AcccountList'
import { useDeleteWallet } from 'common/hooks/useDeleteWallet'
import { UserPreferences } from 'features/accountSettings/components/UserPreferences'
import { About } from 'features/accountSettings/components/About'
import { AppAppearance } from 'features/accountSettings/components/AppAppearance'
import {
  selectIsBalanceVisibilityOn,
  toggleBalanceVisibility
} from 'store/settings/securityPrivacy'

const AccountSettingsScreen = (): JSX.Element => {
  const { deleteWallet } = useDeleteWallet()
  const dispatch = useDispatch()
  const toggleVisibility = useSelector(toggleBalanceVisibility)
  const isBalanceVisibilityOn = useSelector(selectIsBalanceVisibilityOn)
  const activeAccount = useSelector(selectActiveAccount)
  const totalBalanceInCurrency = useTotalBalanceInCurrencyForAccount(
    activeAccount?.index ?? 0
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const {
    theme: { colors }
  } = useTheme()
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
          isVisible={isBalanceVisibilityOn}
          onPress={() => dispatch(toggleVisibility)}
        />
      </View>
    )
  }, [dispatch, isBalanceVisibilityOn, toggleVisibility])

  useEffect(() => {
    setOptions({
      headerRight: renderHeaderRight
    })
  }, [renderHeaderRight, setOptions])

  const goToSelectAvatar = useCallback(() => {
    navigate('./selectAvatar')
  }, [navigate])

  const goToAppAppearance = useCallback(() => {
    navigate('./appAppearance')
  }, [navigate])

  const goToAppIcon = useCallback(() => {
    navigate('./appIcon')
  }, [navigate])

  const goToCurrency = useCallback(() => {
    navigate('./currency')
  }, [navigate])

  const goToNotificationPreferences = useCallback(() => {
    navigate('./notificationPreferences')
  }, [navigate])

  const goToSecurityPrivacy = useCallback(() => {
    navigate('./securityPrivacy')
  }, [navigate])

  const goToHelpCenter = useCallback(() => {
    navigate('./helpCenter')
  }, [navigate])

  const goToLegal = useCallback(() => {
    navigate('./legal')
  }, [navigate])

  const goToSendFeedback = useCallback(() => {
    navigate('./sendFeedback')
  }, [navigate])

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerSx={{ paddingBottom: 60 }}
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
              sx={{ marginTop: 5, height: 150 }}>
              <Avatar
                backgroundColor="transparent"
                size={150}
                // todo: replace with actual avatar
                source={{
                  uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
                }}
                hasBlur={false}
                hasLoading={false}
              />
            </TouchableOpacity>
          </Animated.View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginTop: 23
            }}>
            <AnimatedText
              characters={totalBalanceInCurrency}
              variant="heading2"
              sx={{ lineHeight: 38 }}
            />
            <Animated.View
              entering={FadeIn.delay(250)}
              layout={LinearTransition.springify().damping(100)}>
              <Text
                style={{
                  fontFamily: 'Aeonik-Medium',
                  fontSize: 18,
                  lineHeight: 38
                }}>
                {` ${selectedCurrency}`}
              </Text>
            </Animated.View>
          </View>
          <Text variant="body1" sx={{ marginTop: 2 }}>
            Total net worth
          </Text>
        </View>

        {/* Account list */}
        <AccountList />

        {/* Settings */}
        <View sx={{ gap: 24 }}>
          <View sx={{ gap: 12 }}>
            <AppAppearance
              selectAppAppearance={goToAppAppearance}
              selectAppIcon={goToAppIcon}
              selectCurrency={goToCurrency}
            />
            <UserPreferences
              selectNotificationPreferences={goToNotificationPreferences}
              selectSecurityPrivacy={goToSecurityPrivacy}
            />
            <About
              selectHelpCenter={goToHelpCenter}
              selectLegal={goToLegal}
              selectSendFeedback={goToSendFeedback}
            />
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
              Delete Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View sx={{ gap: 8, alignItems: 'center' }}>
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
