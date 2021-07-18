import React, {Component} from 'react'
import {Alert, Appearance, ScrollView, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import {UserCredentials} from "react-native-keychain"
import BiometricsSDK from "../BiometricsSDK"
import WalletSDK from "../WalletSDK"
import {AsyncSubject, from} from "rxjs"
import PolyfillCrypto from "react-native-webview-crypto"
import LoginViewModel, {DocPickEvents, Finished, PasswordPrompt} from "./LoginViewModel"
import PasswordInput from "../common/PasswordInput"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onEnterSingletonWallet: (privateKey: string) => void,
  onBack: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string
  privateKey: string
  showPasswordPrompt: boolean
}

class Login extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  viewModel: LoginViewModel
  prompt?: AsyncSubject<string>

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      showPasswordPrompt: false,
      backgroundStyle: {},
      mnemonic: "",
      privateKey: "PrivateKey-",
    }
    this.viewModel = new LoginViewModel()
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))

    this.promptForWalletLoadingIfExists()
  }

  private promptForWalletLoadingIfExists() {
    from(BiometricsSDK.loadWalletKey(BiometricsSDK.loadOptions)).subscribe({
      next: value => {
        if (value !== false) {
          const mnemonic = (value as UserCredentials).password
          this.props.onEnterWallet(mnemonic)
          this.setState({mnemonic: mnemonic})
        }
      },
      error: err => console.log(err.message)
    })
  }

  componentWillUnmount(): void {
  }

  private onEnterTestWallet = (): void => {
    this.props.onEnterWallet(WalletSDK.testMnemonic())
  }

  private onBack = (): void => {
    this.props.onBack()
  }

  private onDocumentPick = (): void => {
    this.viewModel.onDocumentPick().subscribe({
      next: (value: DocPickEvents) => {
        if (value instanceof PasswordPrompt) {
          this.prompt = value.prompt
          this.setState({showPasswordPrompt: true})
        } else if (value instanceof Finished) {
          this.props.onEnterWallet(value.mnemonic)
        }
      },
      error: err => Alert.alert("Error", err)
    })
  }

  private onOk = (password?: string): void => {
    this.prompt?.next(password || "")
    this.prompt?.complete()
    this.prompt = undefined
    this.setState({showPasswordPrompt: false})
  }

  private onCancel = ():void => {
    this.prompt?.error("User canceled")
    this.prompt = undefined
    this.setState({showPasswordPrompt: false})
  }

  render(): Element {
    const pwdInput = this.state.showPasswordPrompt && <PasswordInput onOk={this.onOk} onCancel={this.onCancel}/>

    return (
      <ScrollView>
        <View style={styles.verticalLayout}>
          <Header showBack onBack={this.onBack}/>
          <View style={[{height: 8}]}/>

          <TextTitle text={"HD Wallet"} textAlign={"center"} bold={true}/>
          <View style={[{height: 8}]}/>
          <InputText
            onSubmit={() => this.props.onEnterWallet(this.state.mnemonic)}
            multiline={true}
            onChangeText={text => this.setState({mnemonic: text})}
            value={this.state.mnemonic}/>
          <ButtonAva text={"Enter HD wallet"} onPress={() => this.props.onEnterWallet(this.state.mnemonic)}/>

          <TextTitle text={"Singleton wallet"} textAlign={"center"} bold={true}/>
          <View style={[{height: 8}]}/>
          <InputText
            multiline={true}
            onChangeText={text => this.setState({privateKey: text})}
            value={this.state.privateKey}/>
          <ButtonAva text={"Enter singleton wallet"}
                     onPress={() => this.props.onEnterSingletonWallet(this.state.privateKey)}/>

          {/*Needed by Wallet SDK for accessing keystore file*/}
          <PolyfillCrypto/>
          <TextTitle text={"Keystore wallet"} textAlign={"center"} bold={true}/>
          <View style={[{height: 8}]}/>
          <ButtonAva text={"Choose keystore file"} onPress={this.onDocumentPick}/>

          <ButtonAva text={"Enter test HD wallet"} onPress={this.onEnterTestWallet}/>

          {pwdInput}
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
    verticalLayout: {
      justifyContent: "flex-end",
    },
  }
)
export default Login
