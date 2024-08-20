import { useFocusEffect } from '@react-navigation/native'
import { Row } from 'components/Row'
import Separator from 'components/Separator'
import DarkModeSVG from 'components/svg/DarkModeSVG'
import LightModeSVG from 'components/svg/LightModeSVG'
import { useApplicationContext } from 'contexts/ApplicationContext'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AddressBookItem from 'screens/drawer/components/AddressBookItem'
import AdvancedItem from 'screens/drawer/components/AdvancedItem'
import CurrencyItem from 'screens/drawer/components/CurrencyItem'
import DrawerLogo from 'screens/drawer/components/DrawerLogo'
import FeedbackItem from 'screens/drawer/components/FeedbackItem'
import HelpItem from 'screens/drawer/components/HelpItem'
import LegalItem from 'screens/drawer/components/LegalItem'
import NotificationsItem from 'screens/drawer/components/NotificationsItem'
import SecurityItem from 'screens/drawer/components/SecurityItem'
import SignOutItem from 'screens/drawer/components/SignOutItem'
import VersionItem from 'screens/drawer/components/VersionItem'
import SeedlessService from 'seedless/services/SeedlessService'
import { SeedlessSessionManagerEvent } from 'seedless/services/SeedlessSessionManager'
import { selectIsNotificationBlocked, selectUseDarkMode } from 'store/posthog'
import Logger from 'utils/Logger'
import SetupRecoveryMethodsItem from './components/SetupRecoveryMethodsItem'

const DrawerView = (): JSX.Element => {
  const context = useApplicationContext()
  const enableDarkMode = useSelector(selectUseDarkMode)
  const insets = useSafeAreaInsets()

  function toggleDarkLightMode(): void {
    Alert.alert('Toggle dark/light mode')
  }

  const header = (
    <Row style={styles.headerContainer}>
      <DrawerLogo />
      {/* hiding mode toggle until it's implemented */}
      {enableDarkMode && (
        <Pressable
          style={styles.darkLightModeContainer}
          onPress={toggleDarkLightMode}>
          {context.isDarkMode ? <LightModeSVG /> : <DarkModeSVG />}
        </Pressable>
      )}
    </Row>
  )

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: context.theme.colorBg2, paddingTop: insets.top }
      ]}>
      {header}
      <Main />
    </View>
  )
}

const Main = (): JSX.Element => {
  const isNotificationBlocked = useSelector(selectIsNotificationBlocked)

  const [hasRecoveryMethodsFetched, setHasRecoveryMethodsFetched] =
    useState(false)
  const [hasRecoveryMethods, setHasRecoveryMethods] = useState<boolean>(false)
  const [isSeedlessTokenValid, setIsSeedlessTokenValid] =
    useState<boolean>(false)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    SeedlessService.sessionManager.addListener(
      SeedlessSessionManagerEvent.TokenStatusUpdated,
      setIsSeedlessTokenValid
    )

    return () => {
      SeedlessService.sessionManager.removeListener(
        SeedlessSessionManagerEvent.TokenStatusUpdated,
        setIsSeedlessTokenValid
      )
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (hasRecoveryMethods !== true && isSeedlessTokenValid) {
        SeedlessService.sessionManager
          .userMfa()
          .then(mfa => {
            setHasRecoveryMethods(mfa.length > 0)
            setHasRecoveryMethodsFetched(true)
          })
          .catch(Logger.error)
      }
    }, [hasRecoveryMethods, isSeedlessTokenValid])
  )

  return (
    <View
      style={{
        flex: 1,
        paddingBottom: insets.bottom
      }}>
      <ScrollView>
        {hasRecoveryMethodsFetched && hasRecoveryMethods === false && (
          <>
            <SetupRecoveryMethodsItem />
            <Separator style={{ marginHorizontal: 16 }} />
          </>
        )}
        <AddressBookItem />
        <CurrencyItem />
        <AdvancedItem />
        {!isNotificationBlocked && <NotificationsItem />}
        <SecurityItem />
        <Separator style={{ marginHorizontal: 16 }} />
        <FeedbackItem />
        <LegalItem />
        <HelpItem />
      </ScrollView>
      <Separator style={{ marginHorizontal: 16 }} />
      <VersionItem />
      <SignOutItem />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerContainer: {
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginVertical: 16,
    height: 52
  },
  darkLightModeContainer: { flex: 1, alignItems: 'flex-end' }
})

export default DrawerView
