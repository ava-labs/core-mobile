import React, {Component} from "react"
import {Appearance, Button, StyleSheet, Text, TextInput, View} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"
import Header from "../mainView/Header"

type LoginProps = {
  onEnterWallet: (mnemonic: string) => void,
}
type LoginState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  mnemonic: string
}

class Login extends Component<LoginProps, LoginState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: LoginProps | Readonly<LoginProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      mnemonic: "capable maze trophy install grunt close left visa cheap tilt elder end mosquito culture south stool baby animal donate creek outer learn kitten tonight",
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

  onEnterWallet(): void {
    this.props.onEnterWallet(this.state.mnemonic)
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
          Mnemonic Wallet
        </Text>
        <TextInput
          style={styles.input}
          multiline={true}
          onChangeText={text => {
            this.setState({
              mnemonic: text
            })
          }}
          value={this.state.mnemonic}
        />
        <Button
          title={"Enter wallet"}
          onPress={() => {
            this.onEnterWallet()
          }}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 26,
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

export default Login
