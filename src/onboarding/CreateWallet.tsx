import React, {Component} from 'react'
import {Appearance, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import CreateWalletViewModel from './CreateWalletViewModel'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"

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
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)
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

  onSavedMyPhrase(): void {
    this.props.onSavedMyPhrase(this.viewModel.mnemonic)
  }

  render(): Element {
    return (
      <View>
        <Header/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"Here are you 24 word key phrase. Please store it somewhere safe."} size={20}
                   textAlign={"center"}/>
        <View style={[{height: 8}]}/>
        <TextTitle text={"For testing purposes, this is always the same phrase!!"} size={20} textAlign={"center"}
                   bold={true}/>

        <InputText multiline={true} value={this.state.mnemonic}/>

        <ButtonAva text={"I saved my phrase somewhere safe"} onPress={() => this.onSavedMyPhrase()}/>
        <ButtonAva text={"Back"} onPress={() => this.onClose()}/>
      </View>
    )
  }
}

export default CreateWallet
