import React, {Component} from "react"
import {Appearance, Image, ImageSourcePropType, StyleSheet, TouchableNativeFeedback, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import {PlatformRules} from "./PlatformRules"

type Props = {
  src: ImageSourcePropType,
  onPress: () => void
}
type State = {
  isDarkMode: boolean,
}

class ImgButtonAva extends Component<Props, State> {
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

  private onPress = () => {
    PlatformRules.delayedPress(this.props.onPress)
  }

  render(): Element {
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (

      <TouchableNativeFeedback
        useForeground={true}
        onPress={this.onPress}
        background={TouchableNativeFeedback.Ripple(THEME.primaryColor, true)}>
        <View style={styles.container}>
          <Image source={this.props.src} style={styles.button}/>
        </View>
      </TouchableNativeFeedback>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "baseline"
  },
  button: {
    margin: 10,
    width: 24,
    height: 24,
  },
})

export default ImgButtonAva
