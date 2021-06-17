import React, {Component} from "react"
import {Appearance, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"

type SendAvaxXProps = {
  onClose: () => void,
  onSend: (addressX: string, amount: string) => void,
}
type SendAvaxXState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  addressXToSendTo: string,
  sendAmount: string,
}

class SendAvaxX extends Component<SendAvaxXProps, SendAvaxXState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: SendAvaxXProps | Readonly<SendAvaxXProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      addressXToSendTo: '',
      sendAmount: '0.00',
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  render(): Element {
    return (

      <SafeAreaView style={this.state.backgroundStyle}>
        <TextTitle text={"Send AVAX (X Chain)"}/>
        <TextTitle text={"To:"} size={18}/>
        <InputText
          onChangeText={text => this.setState({addressXToSendTo: text})}
          value={this.state.addressXToSendTo}/>

        <TextTitle text={"Amount:"} size={18}/>
        <InputAmount
          onChangeText={text => this.setState({sendAmount: text})}
          value={this.state.sendAmount}/>

        <View style={styles.horizontalLayout}>
          <View style={styles.button}>
            <ButtonAva text={'Cancel'} onPress={this.props.onClose}/>
          </View>
          <View style={styles.button}>
            <ButtonAva
              text={'Send'}
              onPress={() => this.props.onSend(this.state.addressXToSendTo, this.state.sendAmount)}/>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: "row",
  },
})

export default SendAvaxX
