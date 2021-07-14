import React, {Component} from "react"
import {Appearance, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import SendAvaxX from "../sendAvax/SendAvaxX"
import SendAvaxC from "../sendAvax/SendAvaxC"
import SendCrossChain from "../sendAvax/SendCrossChain";
import ButtonAva from "../common/ButtonAva"
import Header from "../mainView/Header"
import SendViewModel from "./SendViewModel"
import TextTitle from "../common/TextTitle"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

type Props = {
  wallet: WalletProvider,
}
type State = {
  isDarkMode: boolean
  sendXVisible: boolean
  sendCVisible: boolean
  crossChainVisible: boolean
}

class SendView extends Component<Props, State> {
  viewModel!: SendViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      sendXVisible: false,
      sendCVisible: false,
      crossChainVisible: false,
    }
    this.viewModel = new SendViewModel(this.props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  componentWillUnmount(): void {
  }


  render(): Element {

    return (
      <View style={styles.container}>
        <Header />
        <TextTitle text={"Send"}/>
        <View style={styles.buttons}>
          <ButtonAva
            text={"Send AVAX X"}
            onPress={() => this.setState({sendXVisible: true})}/>
          <ButtonAva
            text={"Send AVAX C"}
            onPress={() => this.setState({sendCVisible: true})}/>
          <ButtonAva
            text={"Cross chain"}
            onPress={() => this.setState({crossChainVisible: true})}/>
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
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingBottom: 88,
  },
  buttons: {
    height: "100%",
    justifyContent: "flex-end"
  }
})

export default SendView
