import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import CurrencyItem from 'screens/drawer/components/CurrencyItem'
import LegalItem from 'screens/drawer/components/LegalItem'
import HelpItem from 'screens/drawer/components/HelpItem'
import Separator from 'components/Separator'
import VersionItem from 'screens/drawer/components/VersionItem'
import { ScrollView } from 'react-native-gesture-handler'
import { Row } from 'components/Row'
import DrawerLogo from 'screens/drawer/components/DrawerLogo'
import CreateNewWalletItem from 'screens/drawerNoWallet/components/CreateNewWalletItem'
import AccessExistingWalletItem from 'screens/drawerNoWallet/components/AccessExistingWalletItem'
import { DrawerContentComponentProps } from '@react-navigation/drawer'

const NoWalletDrawerView = (props: DrawerContentComponentProps) => {
  const context = useApplicationContext()
  const header = (
    <Row {...props} style={styles.headerContainer}>
      <DrawerLogo />
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
        <CreateNewWalletItem />
        <AccessExistingWalletItem />
      </ScrollView>
      <Separator style={{ marginHorizontal: 16 }} />
      <CurrencyItem />
      <Separator style={{ marginHorizontal: 16 }} />
      <LegalItem />
      <HelpItem />
      <Separator style={{ marginHorizontal: 16 }} />
      <VersionItem />
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

export default NoWalletDrawerView
