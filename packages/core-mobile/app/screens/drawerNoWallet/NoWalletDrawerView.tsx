import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Separator from 'components/Separator'
import { ScrollView } from 'react-native-gesture-handler'
import { Row } from 'components/Row'
import DrawerLogo from 'screens/drawer/components/DrawerLogo'
import CreateNewWalletItem from 'screens/drawerNoWallet/components/CreateNewWalletItem'
import AccessExistingWalletItem from 'screens/drawerNoWallet/components/AccessExistingWalletItem'
import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import SignOutItem from 'screens/drawer/components/SignOutItem'
import FlexSpacer from 'components/FlexSpacer'
import CurrencyItem from 'screens/drawerNoWallet/components/CurrencyItem'
import LegalItem from 'screens/drawerNoWallet/components/LegalItem'
import HelpItem from 'screens/drawer/components/HelpItem'
import VersionItem from 'screens/drawer/components/VersionItem'

interface Props {
  drawerProps: DrawerContentComponentProps
}

const NoWalletDrawerView: FC<Props> = ({ drawerProps }) => {
  const context = useApplicationContext()
  const header = (
    <Row {...drawerProps} style={styles.headerContainer}>
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
  const walletState = useSelector(selectWalletState)
  return (
    <View
      style={{
        flex: 1
      }}>
      {walletState === WalletState.NONEXISTENT ? (
        <ScrollView>
          <CreateNewWalletItem />
          <AccessExistingWalletItem />
        </ScrollView>
      ) : (
        <FlexSpacer />
      )}
      <Separator style={{ marginHorizontal: 16 }} />
      <CurrencyItem />
      <Separator style={{ marginHorizontal: 16 }} />
      <LegalItem />
      <HelpItem />
      <Separator style={{ marginHorizontal: 16 }} />
      <VersionItem />
      {walletState !== WalletState.NONEXISTENT && <SignOutItem />}
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
