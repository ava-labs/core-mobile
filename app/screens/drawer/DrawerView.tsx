import React from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import CurrencyItem from 'screens/drawer/components/CurrencyItem'
import SecurityItem from 'screens/drawer/components/SecurityItem'
import LegalItem from 'screens/drawer/components/LegalItem'
import HelpItem from 'screens/drawer/components/HelpItem'
import Separator from 'components/Separator'
import VersionItem from 'screens/drawer/components/VersionItem'
import LightModeSVG from 'components/svg/LightModeSVG'
import DarkModeSVG from 'components/svg/DarkModeSVG'
import { ScrollView } from 'react-native-gesture-handler'
import SignOutItem from 'screens/drawer/components/SignOutItem'
import AddressBookItem from 'screens/drawer/components/AddressBookItem'
import { Row } from 'components/Row'
import AdvancedItem from 'screens/drawer/components/AdvancedItem'
import DrawerLogo from 'screens/drawer/components/DrawerLogo'
import NotificationsItem from 'screens/drawer/components/NotificationsItem'
import { useSelector } from 'react-redux'
import { selectIsNotificationBlocked, selectUseDarkMode } from 'store/posthog'
import FeedbackItem from 'screens/drawer/components/FeedbackItem'

const DrawerView = (): JSX.Element => {
  const context = useApplicationContext()
  const enableDarkMode = useSelector(selectUseDarkMode)

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
      style={[styles.container, { backgroundColor: context.theme.colorBg2 }]}>
      {header}
      <Main />
    </View>
  )
}

const Main = (): JSX.Element => {
  const isNotificationBlocked = useSelector(selectIsNotificationBlocked)

  return (
    <View
      style={{
        flex: 1
      }}>
      <ScrollView>
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
