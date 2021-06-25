import React, {Component} from 'react'
import {Alert, Appearance, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import {UserCredentials} from "react-native-keychain"
import BiometricsSDK from "../BiometricsSDK"
import WalletSDK from "../WalletSDK"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string
}

class Login extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      mnemonic: "",
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))

    BiometricsSDK.loadMnemonic().then(value => {
      this.setState({mnemonic: (value as UserCredentials).password})
    }).catch(reason => Alert.alert("Error", reason.message))

  }

  componentWillUnmount(): void {
  }

  private onEnterWallet = (): void => {
    this.props.onEnterWallet(this.state.mnemonic)
  }

  private onEnterTestWallet = (): void => {
    this.props.onEnterWallet(WalletSDK.testMnemonic())
  }

  private onClose = (): void => {
    this.props.onClose()
  }

  render(): Element {
    return (
      <View>
        <Header/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"Mnemonic Wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>

        <InputText
          multiline={true}
          onChangeText={text => this.setState({mnemonic: text})}
          value={this.state.mnemonic}/>

        <ButtonAva text={"Enter wallet"} onPress={this.onEnterWallet}/>
        <ButtonAva text={"Enter test wallet"} onPress={this.onEnterTestWallet}/>
        <ButtonAva text={"Back"} onPress={this.onClose}/>
      </View>
    )
  }
}

export default Login
