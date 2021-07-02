import React, {Component} from 'react'
import {Appearance, StyleSheet, ToastAndroid, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import CreateWalletViewModel from './CreateWalletViewModel'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import Clipboard from "@react-native-clipboard/clipboard"

type Props = {
  onClose: () => void,
  onSavedMyPhrase: (mnemonic: string) => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string,
}

class CreateWallet extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  viewModel: CreateWalletViewModel = new CreateWalletViewModel()

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      mnemonic: this.viewModel.mnemonic,
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  onClose(): void {
    this.props.onClose()
  }

  private onSavedMyPhrase = (): void => {
    this.props.onSavedMyPhrase(this.viewModel.mnemonic)
  }

  private copyToClipboard = (): void => {
    Clipboard.setString(this.state.mnemonic)
    ToastAndroid.show("Copied", 1000)
  }

  render(): Element {
    return (
      <View style={styles.verticalLayout}>
        <Header onBack={() => this.onClose()}/>
        <View style={[{height: 8}]}/>

        <View style={styles.growContainer}>
          <TextTitle text={"Here are your 24 word key phrase."} size={20}
                     textAlign={"center"}/>
          <TextTitle text={"Please store it somewhere safe."} size={20}
                     textAlign={"center"}/>
          <View style={[{height: 8}]}/>
          <InputText multiline={true} value={this.state.mnemonic} editable={false}/>
          <ButtonAva text={"Copy to clipboard"} onPress={this.copyToClipboard}/>
        </View>

        <ButtonAva text={"I saved my phrase somewhere safe"} onPress={this.onSavedMyPhrase}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
    verticalLayout: {
      height: "100%",
      justifyContent: "flex-end",
    },
    growContainer: {
      flexGrow: 1,
      justifyContent: "center"
    },
  }
)
export default CreateWallet
