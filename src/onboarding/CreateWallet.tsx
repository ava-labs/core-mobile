import React, {Component} from 'react'
import {Appearance, Button, StyleSheet, Text, TextInput, View} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import CreateWalletViewModel from './CreateWalletViewModel'

type CreateWalletProps = {
  onClose: () => void,
  onSavedMyPhrase: (mnemonic: string) => void,
}
type CreateWalletState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string,
}

class CreateWallet extends Component<CreateWalletProps, CreateWalletState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)
  viewModel: CreateWalletViewModel = new CreateWalletViewModel()

  constructor(props: CreateWalletProps | Readonly<CreateWalletProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      mnemonic: this.viewModel.mnemonic,
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })
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
        <Text
          style={[
            styles.text,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          Here are you 24 word key phrase. Please store it somewhere safe.
        </Text>
        <Text
          style={[
            styles.textBold,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          For testing purposes, this is always the same phrase!!
        </Text>

        <TextInput
          style={styles.input}
          multiline={true}
          value={this.state.mnemonic}
        />

        <Button
          title={"I saved my phrase somewhere safe"}
          onPress={() => {
            this.onSavedMyPhrase()
          }}
        />

        <Button
          title={"Back"}
          onPress={() => {
            this.onClose()
          }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 26
  },
  textBold: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 26
  },
  input: {
    padding: 10,
    margin: 12,
    borderWidth: 1,
  },
})

export default CreateWallet
