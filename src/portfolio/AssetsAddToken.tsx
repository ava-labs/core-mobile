import React, {Component} from "react"
import {Alert, Appearance, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import TextTitle from "../common/TextTitle"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import Header from "../mainView/Header"
import AssetsAddTokenViewModel from "./AssetsAddTokenViewModel"
import InputText from "../common/InputText"
import {BehaviorSubject} from "rxjs"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import ButtonAva from "../common/ButtonAva"

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  tokenContractAddress: string,
  tokenName: string,
  tokenSymbol: string,
  tokenDecimals: string,
  errorMsg: string,
  addTokenBtnDisabled: boolean,
}

class AssetsAddToken extends Component<Props, State> {
  viewModel!: AssetsAddTokenViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      tokenContractAddress: "",
      tokenName: "",
      tokenSymbol: "",
      tokenDecimals: "",
      errorMsg: "",
      addTokenBtnDisabled: true,
    }
    this.viewModel = new AssetsAddTokenViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.tokenContractAddress.subscribe(value => this.setState({tokenContractAddress: value}))
    this.viewModel.tokenName.subscribe(value => this.setState({tokenName: value}))
    this.viewModel.tokenDecimals.subscribe(value => this.setState({tokenDecimals: value}))
    this.viewModel.tokenSymbol.subscribe(value => this.setState({tokenSymbol: value}))
    this.viewModel.errorMsg.subscribe(value => this.setState({errorMsg: value}))
    this.viewModel.addTokenBtnDisabled.subscribe(value => this.setState({addTokenBtnDisabled: value}))
  }

  componentWillUnmount(): void {
  }

  private setContractAddress = (address: string): void => {
    this.viewModel.setAddress(address)
  }

  private onAddToken = (): void => {
    this.viewModel.onAddToken().subscribe({
      error: err => Alert.alert("Error", err.message),
      complete: () => Alert.alert("Success", "", [
        {text: 'Ok', onPress: () => this.props.onClose()},
      ])
    })
  }


  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS

    return (

      <SafeAreaView style={this.state.backgroundStyle}>
        <Header showBack onBack={this.props.onClose}/>
        <TextTitle text={"Add Token"}/>
        <TextTitle text={"Token Contract Address"} size={18}/>
        <InputText
          multiline={true}
          onChangeText={text => this.setContractAddress(text)}
          value={this.state.tokenContractAddress}/>

        <TextTitle textAlign={"center"} text={this.state.errorMsg} size={18} color={THEME.error}/>

        <TextTitle text={"Token Name"} size={18}/>
        <InputText
          editable={false}
          multiline={true}
          value={this.state.tokenName}/>

        <TextTitle text={"Token Symbol"} size={18}/>
        <InputText
          editable={false}
          multiline={true}
          value={this.state.tokenSymbol}/>

        <TextTitle text={"Decimals of Precision"} size={18}/>
        <InputText
          editable={false}
          multiline={true}
          value={this.state.tokenDecimals}/>

        <View style={[{flexGrow: 1, justifyContent: "flex-end"}]}>
          <ButtonAva disabled={this.state.addTokenBtnDisabled} text={"Add token"}
                     onPress={this.onAddToken}/>
        </View>

      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({})

export default AssetsAddToken
