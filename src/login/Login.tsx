import React, {Component} from 'react'
import {Appearance, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import {UserCredentials} from "react-native-keychain"
import BiometricsSDK from "../BiometricsSDK"
import WalletSDK from "../WalletSDK"
import {from} from "rxjs"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onBack: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string
}

class Login extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

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

    this.promptForWalletLoadingIfExists()
  }

  private promptForWalletLoadingIfExists() {
    from(BiometricsSDK.loadMnemonic(BiometricsSDK.loadOptions)).subscribe({
      next: value => {
        if (value !== false) {
          const mnemonic = (value as UserCredentials).password
          this.onEnterWallet(mnemonic)
          this.setState({mnemonic: mnemonic})
        }
      },
      error: err => console.log(err.message)
    })
  }

  componentWillUnmount(): void {
  }

  private onEnterWallet = (mnemonic: string): void => {
    this.props.onEnterWallet(mnemonic)
  }

  private onEnterTestWallet = (): void => {
    this.props.onEnterWallet(WalletSDK.testMnemonic())
  }

  private onBack = (): void => {
    this.props.onBack()
  }

  render(): Element {
    return (
      <View style={styles.verticalLayout}>
        <Header showBack onBack={this.onBack}/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"Mnemonic Wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>

        <InputText
          style={styles.grow}
          multiline={true}
          onChangeText={text => this.setState({mnemonic: text})}
          value={this.state.mnemonic}/>

        <ButtonAva text={"Enter wallet"} onPress={() => this.onEnterWallet(this.state.mnemonic)}/>
        <ButtonAva text={"Enter test wallet"} onPress={this.onEnterTestWallet}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
    verticalLayout: {
      height: "100%",
      justifyContent: "flex-end",
    },
    grow: {
      flexGrow: 1,
      textAlignVertical: "top",
    }
  }
)
export default Login
