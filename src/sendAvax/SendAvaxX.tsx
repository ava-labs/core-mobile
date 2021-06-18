import React, {Component} from "react"
import {Alert, Appearance, Modal, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"
import Loader from "../common/Loader"
import SendAvaxXViewModel from "./SendAvaxXViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import QrScannerAva from "../common/QrScannerAva"

type SendAvaxXProps = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type SendAvaxXState = {
  isDarkMode: boolean,
  cameraVisible: boolean,
  loaderVisible: boolean,
  loaderMsg: string,
  backgroundStyle: any,
  addressXToSendTo: string,
  sendAmount: string,
}

class SendAvaxX extends Component<SendAvaxXProps, SendAvaxXState> {
  viewModel!: SendAvaxXViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: SendAvaxXProps | Readonly<SendAvaxXProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      cameraVisible: false,
      loaderVisible: false,
      loaderMsg: '',
      backgroundStyle: {},
      addressXToSendTo: '',
      sendAmount: '0.00',
    }
    this.viewModel = new SendAvaxXViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.loaderMsg.subscribe(value => this.setState({loaderMsg: value}))
    this.viewModel.loaderVisible.subscribe(value => this.setState({loaderVisible: value}))
    this.viewModel.cameraVisible.subscribe(value => this.setState({cameraVisible: value}))
    this.viewModel.addressXToSendTo.subscribe(value => this.setState({addressXToSendTo: value}))
  }

  componentWillUnmount(): void {
  }

  onSend(addressX: string, amount: string): void {
    this.viewModel.onSendAvaxX(addressX, amount)
      .subscribe({
        next: txHash => {
          Alert.alert("Success", "Created transaction: " + txHash)
        },
        error: err => Alert.alert("Error", err.message),
        complete: () => {
        },
      })
  }

  private pasteFromClipboard(): void {
    this.viewModel.pasteFromClipboard().subscribe({
      error: err => Alert.alert("Error", err.message)
    })
  }

  render(): Element {
    return (

      <SafeAreaView style={this.state.backgroundStyle}>
        <TextTitle text={"Send AVAX (X Chain)"}/>
        <TextTitle text={"To:"} size={18}/>
        <InputText
          multiline={true}
          onChangeText={text => this.setState({addressXToSendTo: text})}
          value={this.state.addressXToSendTo}/>

        <View style={styles.horizontalLayout}>
          <ButtonAva text={'Clear'} onPress={() => this.viewModel.clearAddress()}/>
          <ButtonAva text={'Paste'} onPress={() => this.pasteFromClipboard()}/>
          <ButtonAva text={'Scan'} onPress={() => this.viewModel.onScanBarcode()}/>
        </View>

        <TextTitle text={"Amount:"} size={18}/>
        <InputAmount
          showControls={true}
          onChangeText={text => this.setState({sendAmount: text})}/>

        <View style={styles.horizontalLayout}>
          <ButtonAva text={'Cancel'} onPress={this.props.onClose}/>
          <ButtonAva
            text={'Send'}
            onPress={() => this.onSend(this.state.addressXToSendTo, this.state.sendAmount)}/>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={this.state.loaderMsg}/>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          onRequestClose={() => this.setState({cameraVisible: false})}
          visible={this.state.cameraVisible}>
          <QrScannerAva onSuccess={data => this.viewModel.onBarcodeScanned(data)}
                        onCancel={() => this.setState({cameraVisible: false})}/>
        </Modal>

      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: "row",
  },
})

export default SendAvaxX
