import React, {useEffect, useState} from "react"
import {Alert, Appearance, Image, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import MainViewViewModel from "./MainViewViewModel"
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from "@react-navigation/native"
import PortfolioView from "../portfolio/PortfolioView"
import SendView from "../sendAvax/SendView"
import EarnView from "../earn/EarnView"
import TransactionsView from "../transactions/TransactionsView"
import Loader from "../common/Loader"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import AssetsView from "../portfolio/AssetsView"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"
import {Subscription} from "rxjs"

type Props = {
  wallet: WalletProvider,
  onExit: () => void,
  onSwitchWallet: () => void,
}

const Tab = createBottomTabNavigator()

export default function MainView(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [viewModel] = useState(new MainViewViewModel(props.wallet))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [walletReady, setWalletReady] = useState(false)

  useEffect(() => {
    const disposables = new Subscription()
    disposables.add(viewModel.onResetHdIndices()
      .subscribe({
        error: err => {
          onExit()
          Alert.alert("Error", err.message)
        },
        complete: () => setWalletReady(true),
      }))

    return () => {
      disposables.unsubscribe()
    }
  }, [])

  const onExit = (): void => {
    props.onExit()
  }

  const onSwitchWallet = (): void => {
    props.onSwitchWallet()
  }

  const screenOptions = (params: any, isDarkMode: boolean): any => {
    return {
      tabBarIcon: () => {
        let icon;
        if (params.route.name === 'Portfolio') {
          icon = isDarkMode ? require("../assets/icons/portfolio_dark.png") : require("../assets/icons/portfolio_light.png")
        } else if (params.route.name === 'Send') {
          icon = isDarkMode ? require("../assets/icons/send_dark.png") : require("../assets/icons/send_light.png")
        } else if (params.route.name === 'Earn') {
          icon = isDarkMode ? require("../assets/icons/earn_dark.png") : require("../assets/icons/earn_light.png")
        } else if (params.route.name === 'Transactions') {
          icon = isDarkMode ? require("../assets/icons/history_dark.png") : require("../assets/icons/history_light.png")
        }

        return <Image source={icon} style={[{width: 24, height: 24}]}/>
      },
    }
  }
  const Portfolio = () => <PortfolioView wallet={viewModel.wallet} onSwitchWallet={onSwitchWallet} onExit={onExit}/>
  const Assets = () => <AssetsView wallet={viewModel.wallet}/>
  const Send = () => <SendView wallet={viewModel.wallet.value}/>
  const Earn = () => <EarnView wallet={viewModel.wallet.value}/>
  const Transactions = () => <TransactionsView wallet={viewModel.wallet.value}/>
  const Nav = () => (
    <NavigationContainer>
      <Tab.Navigator sceneContainerStyle={styles.navContainer}
                     screenOptions={props => screenOptions(props, isDarkMode)}
                     tabBarOptions={{
                       allowFontScaling: false,
                       activeBackgroundColor: THEME.bg,
                       inactiveBackgroundColor: THEME.bg,
                       activeTintColor: THEME.primaryColor,
                       inactiveTintColor: THEME.primaryColorLight,
                     }}>
        <Tab.Screen name="Portfolio" component={Portfolio}/>
        <Tab.Screen name="Assets" component={Assets}/>
        <Tab.Screen name="Send" component={Send}/>
        <Tab.Screen name="Earn" component={Earn}/>
        <Tab.Screen name="Transactions" component={Transactions}/>
      </Tab.Navigator>
    </NavigationContainer>
  )

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={!walletReady}>
        <Loader message={"Loading wallet"}/>
      </Modal>

      <View style={styles.container}>
        {walletReady && Nav()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%"
  },
  navContainer: {
    backgroundColor: "transparent",
    paddingStart: 16,
    paddingEnd: 16,
  },
})

