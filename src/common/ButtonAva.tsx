import React, {Component} from "react"
import {Appearance, StyleSheet, TouchableNativeFeedback, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextButton from "./TextButton"
import {PlatformRules} from "./PlatformRules"

type Props = {
  text: string,
  onPress: () => void,
  disabled?: boolean
}
type State = {
  isDarkMode: boolean,
}

class ButtonAva extends Component<Props, State> {
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
        disabled={this.props.disabled}
        useForeground={true}
        onPress={() => this.onPress()}
        background={TouchableNativeFeedback.Ripple(THEME.onPrimary, false)}>
        <View style={[styles.button, {backgroundColor: THEME.primaryColor}]}>
          <TextButton disabled={this.props.disabled} text={this.props.text}/>
        </View>
      </TouchableNativeFeedback>
    )
  }
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 4,
  },
})

export default ButtonAva
