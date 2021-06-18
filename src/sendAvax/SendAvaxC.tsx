import React, {Component} from "react"
import {Alert, Appearance, Modal, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import SendAvaxCViewModel from "./SendAvaxCViewModel"
import Clipboard from "@react-native-clipboard/clipboard"
import Loader from "../common/Loader"

type SendAvaxCProps = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type SendAvaxCState = {
  isDarkMode: boolean,
  loaderVisible: boolean,
  loaderMsg: string,
  backgroundStyle: any,
  addressCToSendTo: string,
  sendAmount: string,
}

class SendAvaxC extends Component<SendAvaxCProps, SendAvaxCState> {
  viewModel!: SendAvaxCViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: SendAvaxCProps | Readonly<SendAvaxCProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      loaderVisible: false,
      loaderMsg: '',
      backgroundStyle: {},
      addressCToSendTo: '',
      sendAmount: '0.0',
    }
    this.viewModel = new SendAvaxCViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.loaderMsg.subscribe(value => this.setState({loaderMsg: value}))
    this.viewModel.loaderVisible.subscribe(value => this.setState({loaderVisible: value}))
  }

  componentWillUnmount(): void {
  }

  private clearAddress(): void {
    this.setState({addressCToSendTo: ""})
  }

  private pasteFromClipboard(): void {
    Clipboard.getString().then(value => this.setState({addressCToSendTo: value}))
  }

  private scanBarcode(): void {

  }

  private onSend(addressC: string, amount: string): void {
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

  render(): Element {
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <TextTitle text={"Send AVAX (C Chain)"}/>
        <TextTitle text={"To:"} size={18}/>
        <InputText
          multiline={true}
          onChangeText={text => this.setState({addressCToSendTo: text})}
          value={this.state.addressCToSendTo}/>

        <View style={styles.horizontalLayout}>
          <ButtonAva text={'Clear'} onPress={() => this.clearAddress()}/>
          <ButtonAva text={'Paste'} onPress={() => this.pasteFromClipboard()}/>
          <ButtonAva text={'Scan'} onPress={() => this.scanBarcode()}/>
        </View>

        <TextTitle text={"Amount:"} size={18}/>
        <InputAmount
          onChangeText={text => this.setState({sendAmount: text})}
          value={this.state.sendAmount}/>

        <View style={styles.horizontalLayout}>
          <ButtonAva
            text={'Cancel'}
            onPress={this.props.onClose}/>
          <ButtonAva
            text={'Send'}
            onPress={() => this.onSend(this.state.addressCToSendTo, this.state.sendAmount)}/>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={this.state.loaderMsg}/>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: "700",
    marginEnd: 20,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  horizontalLayout: {
    flexDirection: "row",
  },
})

export default SendAvaxC
