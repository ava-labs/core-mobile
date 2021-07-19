import React, {Component} from "react"
import {Alert, Appearance, Modal, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"
import Loader from "../common/Loader"
import SendAvaxXViewModel from "./SendAvaxXViewModel"
import QrScannerAva from "../common/QrScannerAva"
import Header from "../mainView/Header"
import ImgButtonAva from "../common/ImgButtonAva"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

type SendAvaxXProps = {
  wallet: WalletProvider,
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
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

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

  private onSend = (addressX: string, amount: string): void => {
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

  private ClearBtn = () => {
    const clearIcon = this.state.isDarkMode ? require("../assets/icons/clear_dark.png") : require("../assets/icons/clear_light.png")
    return <View style={styles.clear}>
      <ImgButtonAva src={clearIcon} onPress={() => this.viewModel.clearAddress()}/>
    </View>
  }

  render(): Element {
    const scanIcon = this.state.isDarkMode ? require("../assets/icons/qr_scan_dark.png") : require("../assets/icons/qr_scan_light.png")
    const clearBtn = this.state.addressXToSendTo.length != 0 && this.ClearBtn()

    return (

      <SafeAreaView style={this.state.backgroundStyle}>
        <Header showBack onBack={this.props.onClose}/>
        <TextTitle text={"Send AVAX (X Chain)"}/>
        <TextTitle text={"To:"} size={18}/>

        <View style={styles.horizontalLayout}>
          <InputText
            style={[{flex: 1}]}
            multiline={true}
            onChangeText={text => this.setState({addressXToSendTo: text})}
            value={this.state.addressXToSendTo}/>
          {clearBtn}
          <ImgButtonAva src={scanIcon} onPress={() => this.viewModel.onScanBarcode()}/>
        </View>

        <TextTitle text={"Amount:"} size={18}/>
        <InputAmount
          showControls={true}
          onChangeText={text => this.setState({sendAmount: text})}/>

        <ButtonAva text={'Send'} onPress={() => this.onSend(this.state.addressXToSendTo, this.state.sendAmount)}/>

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
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  clear: {
    position: "absolute",
    end: 58,
  },
})

export default SendAvaxX
