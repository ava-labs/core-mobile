import React, {Component} from "react"
import {Appearance, SafeAreaView, StyleSheet} from "react-native"
import CommonViewModel from "../CommonViewModel"
import QRCodeScanner from "react-native-qrcode-scanner"
import {BarCodeReadEvent} from "react-native-camera"
import {COLORS, COLORS_NIGHT} from "./Constants"
import ButtonAva from "./ButtonAva"

type Props = {
  onSuccess: (data: string) => void
  onCancel: () => void
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class QrScannerAva extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  private onSuccess(e: BarCodeReadEvent): void {
    this.props.onSuccess(e.data)
  }


  render(): Element {
    const theme = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <SafeAreaView style={[this.state.backgroundStyle, styles.container]}>
        <QRCodeScanner
          showMarker={true}
          markerStyle={[{
            borderColor: theme.primaryColor,
            borderRadius: 8,
            shadowColor: theme.onPrimary,
            shadowOffset: {width: 4, height: 4},
            shadowRadius: 8,
          }]}
          fadeIn={false}
          onRead={e => this.onSuccess(e)}
          cameraType={"back"}
         />
        <ButtonAva text={"Cancel"} onPress={() => this.props.onCancel()} />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
    container: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingStart: 0,
      paddingEnd: 0,
    },
  }
)

export default QrScannerAva
