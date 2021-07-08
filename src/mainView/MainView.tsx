import React, {Component} from "react"
import {Appearance, Image, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import MainViewViewModel from "./MainViewViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from "@react-navigation/native"
import Portfolio from "../portfolio/Portfolio"
import SendView from "../sendAvax/SendView"
import EarnView from "../earn/EarnView"
import Transactions from "../transactions/Transactions"
import Loader from "../common/Loader"

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

  private screenOptions = (params: any): any => {
    return {
      tabBarIcon: ({focused, color, size}) => {
        let icon;

        if (params.route.name === 'Portfolio') {
          icon = require("../assets/icons/portfolio_light.png")
        } else if (params.route.name === 'Send') {
          icon = require("../assets/icons/send_light.png")
        }else if (params.route.name === 'Earn') {
          icon = require("../assets/icons/earn_light.png")
        }else if (params.route.name === 'Transactions') {
          icon = require("../assets/icons/history_light.png")
        }

        return <Image source={icon} style={[{width: 24, height: 24}]}/>
      },
    }
  }

  private _Portfolio = () => <Portfolio wallet={this.viewModel.wallet.value} onSwitchWallet={this.onSwitchWallet}
                                        onExit={this.onExit}/>
  private _Send = () => <SendView wallet={this.viewModel.wallet.value}/>
  private _Earn = () => <EarnView wallet={this.viewModel.wallet.value}/>
  private _Transactions = () => <Transactions wallet={this.viewModel.wallet.value}/>
  private _Nav = () => (
    <NavigationContainer>
      <Tab.Navigator sceneContainerStyle={styles.navContainer} screenOptions={props => this.screenOptions(props)}>
        <Tab.Screen name="Portfolio" component={this._Portfolio}/>
        <Tab.Screen name="Send" component={this._Send}/>
        <Tab.Screen name="Earn" component={this._Earn}/>
        <Tab.Screen name="Transactions" component={this._Transactions}/>
      </Tab.Navigator>
    </NavigationContainer>
  )

  render(): Element {
    return (
      <View style={styles.container}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={!this.state.walletReady}>
          <Loader message={"Loading wallet"}/>
        </Modal>

        {this.state.walletReady && this._Nav()}
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
})

export default MainView
