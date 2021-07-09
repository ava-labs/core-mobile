import React, {Component} from "react"
import {Appearance, Image, ImageSourcePropType, StyleSheet, TouchableNativeFeedback} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

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

  render(): Element {
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <TouchableNativeFeedback style={styles.container}
                               onPress={this.props.onPress}
                               background={TouchableNativeFeedback.Ripple(THEME.primaryColor, true)}>
        <Image source={this.props.src} style={styles.button}/>
      </TouchableNativeFeedback>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100
  },
  button: {
    margin: 10,
    width: 24,
    height: 24,
  },
})

export default ImgButtonAva
