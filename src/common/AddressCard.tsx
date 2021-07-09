import React, {Component} from "react"
import {Appearance, Share, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextTitle from "./TextTitle"
import QRCode from "react-native-qrcode-svg"
import ButtonAva from "./ButtonAva"

type Props = {
  title: string,
  address: string,
}
type State = {
  isDarkMode: boolean,
}

class AddressCard extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  private onShare(address: string): void {
    Share.share({
      title: "title",
      message: address,
    }, {
      dialogTitle: "dialog Title",
    }).then(value => console.log(value))
  }

  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    const qr = this.props.address ? <QRCode value={this.props.address}/> : undefined

    return (
      <View style={[{
        backgroundColor: THEME.bgLight,
        flex: 1,
        height: 100,
      }]}>
        <View style={[{margin: 10}]}>
          <TextTitle text={this.props.title} size={18}/>
        </View>
        <View style={styles.horizontalLayout}>
          <View style={[{margin: 10}]}>
            {qr}
          </View>
          <View style={[{margin: 10, flexShrink: 1}]}>
            <TextTitle text={this.props.address} size={18}/>
          </View>
        </View>
        <ButtonAva text={"Share"} onPress={() => this.onShare(this.props.address)}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
  },
})

export default AddressCard
