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
import TextAmount from "../common/TextAmount"
import TextLabel from "../common/TextLabel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"

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
  availableTotal: string
  availableX: string
  availableP: string
  availableC: string
  lockedX: string
  lockedP: string
  lockedStakeable: string
  stakingAmount: string
  sendXVisible: boolean
  sendCVisible: boolean
  crossChainVisible: boolean
  validateVisible: boolean
  walletCAddress: string
  walletEvmAddress: string
}

class MainView extends Component<Props, State> {
  viewModel!: MainViewViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

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
      availableTotal: "-- AVAX",
      availableX: "-- AVAX",
      availableP: "-- AVAX",
      availableC: "-- AVAX",
      lockedX: "0 AVAX",
      lockedP: "0 AVAX",
      lockedStakeable: "0 AVAX",
      stakingAmount: "-- AVAX",
      sendXVisible: false,
      sendCVisible: false,
      crossChainVisible: false,
      validateVisible: false,
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
    this.viewModel.availableX.subscribe(value => this.setState({availableX: value}))
    this.viewModel.availableP.subscribe(value => this.setState({availableP: value}))
    this.viewModel.availableC.subscribe(value => this.setState({availableC: value}))
    this.viewModel.stakingAmount.subscribe(value => this.setState({stakingAmount: value}))
    this.viewModel.availableTotal.subscribe(value => this.setState({availableTotal: value}))

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

  private onSendC(addressC: string, amount: string): void {
    this.viewModel.onSendAvaxC(addressC, amount)
      .subscribe({
        next: txHash => {
          Alert.alert("Success", "Created transaction: " + txHash)
        },
        error: err => Alert.alert("Error", err.message),
        complete: () => {
        },
      })
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
        <TextAmount text={this.state.availableTotal} size={36} textAlign={"center"}/>

        <View style={styles.horizontalLayout}>
          <View style={styles.column}>
            <TextLabel text={"Available (X)"}/>
            <TextAmount text={this.state.availableX}/>
            <TextLabel text={"Available (P)"}/>
            <TextAmount text={this.state.availableP}/>
            <TextLabel text={"Available (C)"}/>
            <TextAmount text={this.state.availableC}/>
          </View>
          <View style={styles.column}>
            <TextLabel text={"Locked (X)"}/>
            <TextAmount text={this.state.lockedX}/>
            <TextLabel text={"Locked (P)"}/>
            <TextAmount text={this.state.lockedP}/>
            <TextLabel text={"Locked Stakeable"}/>
            <TextAmount text={this.state.lockedStakeable}/>
          </View>
          <View style={styles.column}>
            <TextLabel text={"Staking"}/>
            <TextAmount text={this.state.stakingAmount}/>
          </View>
        </View>

        <View style={[{height: 8}]}/>
        <TextLabel text={"Derived Wallet Address"}/>
        <TextTitle size={14} text={this.state.addressX}/>
        <View style={[{height: 8}]}/>
        <TextLabel text={"Derived Platform Wallet Address"}/>
        <TextTitle size={14} text={this.state.addressP}/>
        <View style={[{height: 8}]}/>
        <TextLabel text={"Derived EVM Wallet Address"}/>
        <TextTitle size={14} text={this.state.addressC}/>
        <View style={[{height: 8}]}/>

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
            text={"LogOut"}
            onPress={() => this.onLogout()}/>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.sendXVisible}
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
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
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
          <SendAvaxC
            onClose={() => {
              this.setState({
                sendCVisible: false,
              })
            }}
            onSend={(addressX, amount) => {
              this.onSendC(addressX, amount)
            }}/>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.crossChainVisible}
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
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
          visible={this.state.validateVisible}>
          <Validate
            wallet={this.viewModel.wallet.value}
            onClose={() => this.setState({validateVisible: false})}/>
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
