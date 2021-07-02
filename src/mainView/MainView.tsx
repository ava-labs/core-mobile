import React, {Component} from "react"
import {Alert, Appearance, Modal, ScrollView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import Header from "./Header"
import MainViewViewModel from "./MainViewViewModel"
import SendAvaxX from "../sendAvax/SendAvaxX"
import SendAvaxC from "../sendAvax/SendAvaxC"
import SendCrossChain from "../sendAvax/SendCrossChain";
import Loader from "../common/Loader"
import Validate from "../earn/Validate"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import ButtonAva from "../common/ButtonAva"
import TabbedAddressCards from "./TabbedAddressCards"
import Balances from "./Balances"
import Transactions from "../transactions/Transactions"

type Props = {
  wallet: MnemonicWallet,
  onLogout: () => void,
}
type State = {
  isDarkMode: boolean
  backgroundStyle: any
  loaderVisible: boolean
  avaxPrice: number
  addressX: string
  addressP: string
  addressC: string
  sendXVisible: boolean
  sendCVisible: boolean
  crossChainVisible: boolean
  validateVisible: boolean
  transactionsVisible: boolean
  walletCAddress: string
  walletEvmAddress: string
}

class MainView extends Component<Props, State> {
  viewModel!: MainViewViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      loaderVisible: true,
      avaxPrice: 0,
      addressX: "",
      addressP: "",
      addressC: "",
      sendXVisible: false,
      sendCVisible: false,
      crossChainVisible: false,
      validateVisible: false,
      transactionsVisible: false,
      walletCAddress: "",
      walletEvmAddress: "",
    }
    this.viewModel = new MainViewViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.viewModel.onComponentMount()

    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.avaxPrice.subscribe(value => this.setState({avaxPrice: value}))
    this.viewModel.walletCAddress.subscribe(value => this.setState({walletCAddress: value}))
    this.viewModel.walletEvmAddrBech.subscribe(value => this.setState({walletEvmAddress: value}))
    this.viewModel.addressX.subscribe(value => this.setState({addressX: value}))
    this.viewModel.addressP.subscribe(value => this.setState({addressP: value}))
    this.viewModel.addressC.subscribe(value => this.setState({addressC: value}))

    this.viewModel.onResetHdIndices()
      .subscribe({
        error: err => {
          this.onLogout()
          Alert.alert("Error", err.message)
        },
        complete: () => this.setState({loaderVisible: false}),
      })
  }

  componentWillUnmount(): void {
    this.viewModel.onComponentUnMount()
  }

  private onLogout(): void {
    this.props.onLogout()
  }

  render(): Element {

    return (
      <ScrollView>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={"Loading wallet..."}/>
        </Modal>

        <Header/>
        <Balances wallet={this.props.wallet}/>
        <TabbedAddressCards addressP={this.state.addressP} addressX={this.state.addressX} addressC={this.state.addressC}/>

        <View style={styles.container}>
          <ButtonAva
            text={"Send AVAX X"}
            onPress={() => this.setState({sendXVisible: true})}/>
          <ButtonAva
            text={"Send AVAX C"}
            onPress={() => this.setState({sendCVisible: true})}/>
          <ButtonAva
            text={"Cross chain"}
            onPress={() => this.setState({crossChainVisible: true})}/>
          <ButtonAva
            text={"Validate"}
            onPress={() => this.setState({validateVisible: true})}/>
          <ButtonAva
            text={"Transactions"}
            onPress={() => this.setState({transactionsVisible: true})}/>
          <ButtonAva
            text={"LogOut"}
            onPress={() => this.onLogout()}/>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.sendXVisible}
          onRequestClose={() => this.setState({sendXVisible: false})}>
          <SendAvaxX
            wallet={this.viewModel.wallet.value}
            onClose={() => {
              this.setState({
                sendXVisible: false,
              })
            }}
          />
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.sendCVisible}
          onRequestClose={() => this.setState({sendCVisible: false})}>
          <SendAvaxC
            wallet={this.viewModel.wallet.value}
            onClose={() => {
              this.setState({
                sendCVisible: false,
              })
            }}/>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.crossChainVisible}
          onRequestClose={() => this.setState({crossChainVisible: false})}>
          <SendCrossChain
            wallet={this.viewModel.wallet.value}
            onClose={() => {
              this.setState({
                crossChainVisible: false,
              })
            }}/>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          onRequestClose={() => this.setState({validateVisible:false})}
          visible={this.state.validateVisible}>
          <Validate
            wallet={this.viewModel.wallet.value}
            onClose={() => this.setState({validateVisible: false})}/>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          onRequestClose={() => this.setState({transactionsVisible:false})}
          visible={this.state.transactionsVisible}>
          <Transactions
            wallet={this.viewModel.wallet.value}
            onClose={() => this.setState({transactionsVisible: false})}/>
        </Modal>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center"
  },
  horizontalLayout: {
    flexDirection: 'row',
    padding: 8,
  },
  column: {
    flex: 1,
  },
})

export default MainView
