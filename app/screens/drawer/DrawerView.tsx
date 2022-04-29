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
import NetworkItem from 'screens/drawer/components/NetworkItem'
import AddressBookItem from 'screens/drawer/components/AddressBookItem'
import { Row } from 'components/Row'
import CoreLogo from 'components/CoreLogo'

const DrawerView = () => {
  const context = useApplicationContext()

  function toggleDarkLightMode() {
    Alert.alert('Toggle dark/light mode')
  }

  const header = (
    <Row style={styles.headerContainer}>
      <CoreLogo
        logoHeight={29}
        textHeight={15}
        orientation={'horizontal'}
        style={{
          justifyContent: 'flex-start'
        }}
      />
      {/* hiding mode toggle until it's implemented */}
      {true || (
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

const Main = () => {
  return (
    <View
      style={{
        flex: 1
      }}>
      <ScrollView>
        <NetworkItem />
        <AddressBookItem />
        <CurrencyItem />
        <Separator style={{ marginHorizontal: 16 }} />
        <SecurityItem />
        <LegalItem />
        <HelpItem />
        {/*<AdvancedItem />*/}
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
