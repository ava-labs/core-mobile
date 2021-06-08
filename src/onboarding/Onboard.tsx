import React, {Component} from 'react'
import {Appearance, Button, StyleSheet, Text, View} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'

type OnboardProps = {
  onCreateWallet: () => void,
  onAlreadyHaveWallet: () => void,
}
type OnboardState = {
  isDarkMode: boolean,
  backgroundStyle: any
}

class Onboard extends Component<OnboardProps, OnboardState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: OnboardProps | Readonly<OnboardProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
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

  onCreateWallet(): void {
    this.props.onCreateWallet()
  }

  onAlreadyHaveWallet(): void {
    this.props.onAlreadyHaveWallet()
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
          Welcome!
        </Text>
        <Button
          title={"Create wallet"}
          onPress={() => {
            this.onCreateWallet()
          }}
        />
        <Button
          title={"I already have wallet"}
          onPress={() => {
            this.onAlreadyHaveWallet()
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
})

export default Onboard
