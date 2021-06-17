import React, {Component} from 'react'
import {Appearance, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import WalletSDK from '../WalletSDK'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"

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
      mnemonic: WalletSDK.testMnemonic(),
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  onEnterWallet(): void {
    this.props.onEnterWallet(this.state.mnemonic)
  }

  onClose(): void {
    this.props.onClose()
  }

  render(): Element {
    return (
      <View>
        <Header/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"Mnemonic Wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"Prefilled for testing purposes!!"} size={20} textAlign={"center"} bold={true}/>

        <InputText
          multiline={true}
          onChangeText={text => this.setState({mnemonic: text})}
          value={this.state.mnemonic}/>

        <ButtonAva text={"Enter wallet"} onPress={() => this.onEnterWallet()}/>
        <ButtonAva text={"Back"} onPress={() => this.onClose()}/>
      </View>
    )
  }
}

export default Login
