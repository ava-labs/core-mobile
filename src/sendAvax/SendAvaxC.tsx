import React, {Component} from "react"
import {Appearance, Button, SafeAreaView, StyleSheet, Text, TextInput, View} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"

type SendAvaxCProps = {
  onClose: () => void,
  onSend: (addressC: string, amount: string) => void,
}
type SendAvaxCState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  addressCToSendTo: string,
  sendAmount: string,
}

class SendAvaxC extends Component<SendAvaxCProps, SendAvaxCState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: SendAvaxCProps | Readonly<SendAvaxCProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      addressCToSendTo: '',
      sendAmount: '',
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

  render(): Element {
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <Text
          style={[
            styles.text,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          Send AVAX (C Chain)
        </Text>
        <Text
          style={[
            styles.text,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          To:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => {
            this.setState({
              addressCToSendTo: text
            })
          }}
          value={this.state.addressCToSendTo}
        />
        <Text
          style={[
            styles.text,
            {color: this.state.isDarkMode ? Colors.white : Colors.black},
          ]}>
          Amount:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => {
            this.setState({
              sendAmount: text
            })
          }}
          value={this.state.sendAmount}
        />
        <View style={styles.horizontalLayout}>
          <View style={styles.button}>
            <Button
              title={'Cancel'}
              onPress={this.props.onClose}/>
          </View>
          <View style={styles.button}>
            <Button
              title={'Send'}
              onPress={() => {
                this.props.onSend(this.state.addressCToSendTo, this.state.sendAmount)
              }}/>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: "700",
    marginEnd: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 20,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
  horizontalLayout: {
    flexDirection: "row",
  },
})

export default SendAvaxC
