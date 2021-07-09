import React, {Component} from "react"
import {Alert, Appearance, Image, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import MainViewViewModel from "./MainViewViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from "@react-navigation/native"
import PortfolioView from "../portfolio/PortfolioView"
import SendView from "../sendAvax/SendView"
import EarnView from "../earn/EarnView"
import TransactionsView from "../transactions/TransactionsView"
import Loader from "../common/Loader"
import {COLORS, COLORS_NIGHT} from "../common/Constants"

type Props = {
  wallet: MnemonicWallet,
  onExit: () => void,
  onSwitchWallet: () => void,
}
type State = {
  isDarkMode: boolean
  walletReady: boolean
}

const Tab = createBottomTabNavigator()

class MainView extends Component<Props, State> {
  viewModel!: MainViewViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      walletReady: false,
    }
    this.viewModel = new MainViewViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))

    this.viewModel.onResetHdIndices()
      .subscribe({
        error: err => {
          this.onExit()
          Alert.alert("Error", err.message)
        },
        complete: () => this.setState({walletReady: true}),
      })
  }

  componentWillUnmount(): void {
  }

  private onExit = (): void => {
    this.props.onExit()
  }

  private onSwitchWallet = (): void => {
    this.props.onSwitchWallet()
  }

  private screenOptions = (params: any, isDarkMode: boolean): any => {
    return {
      tabBarIcon: ({focused, color, size}) => {
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

  private Portfolio = () => <PortfolioView wallet={this.viewModel.wallet} onSwitchWallet={this.onSwitchWallet}
                                           onExit={this.onExit}/>
  private Send = () => <SendView wallet={this.viewModel.wallet.value}/>
  private Earn = () => <EarnView wallet={this.viewModel.wallet.value}/>
  private Transactions = () => <TransactionsView wallet={this.viewModel.wallet.value}/>
  // private Nav = () => ( FIXME: this doesnt work, if used wallet wont get balance updates, i dont know the reason
  //   <NavigationContainer>
  //     <Tab.Navigator >
  //       <Tab.Screen name="Portfolio" component={this.Portfolio}/>
  //       <Tab.Screen name="Send" component={this.Send}/>
  //       <Tab.Screen name="Earn" component={this.Earn}/>
  //       <Tab.Screen name="Transactions" component={this.Transactions}/>
  //     </Tab.Navigator>
  //   </NavigationContainer>
  // )

  render(): Element {
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <View style={styles.container}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={!this.state.walletReady}>
          <Loader message={"Loading wallet"}/>
        </Modal>

        <View style={this.state.walletReady ? styles.visible : styles.invisible}>
          <NavigationContainer>
            <Tab.Navigator sceneContainerStyle={styles.navContainer}
                           screenOptions={props => this.screenOptions(props, this.state.isDarkMode)}
                           tabBarOptions={{
                             allowFontScaling: false,
                             activeBackgroundColor: THEME.bg,
                             inactiveBackgroundColor: THEME.bg,
                             activeTintColor: THEME.primaryColor,
                             inactiveTintColor: THEME.primaryColorLight,
                           }}>
              <Tab.Screen name="Portfolio" component={this.Portfolio}/>
              <Tab.Screen name="Send" component={this.Send}/>
              <Tab.Screen name="Earn" component={this.Earn}/>
              <Tab.Screen name="Transactions" component={this.Transactions}/>
            </Tab.Navigator>
          </NavigationContainer>
          {/*FIXME: this doesnt work, if used wallet wont get balance updates, i dont know the reason*/}
          {/*{this.state.walletReady && this.Nav()} */}
        </View>
      </View>
    )
  }
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
  invisible: {
    height: "100%",
    display: "none"
  },
  visible: {
    height: "100%",
    display: "flex"
  },

})

export default MainView
