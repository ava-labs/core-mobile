import React, {Component} from "react"
import {Appearance, Pressable, StyleSheet, TouchableNativeFeedback} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextButton from "./TextButton"

type Props = {
  text: string,
  onPress: () => void
}
type State = {
  isDarkMode: boolean,
}

class ButtonAva extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

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
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple(THEME.bgLight, true)}>
        <Pressable
          style={[styles.button, {backgroundColor: THEME.primaryColor}]}
          onPress={this.props.onPress}>
          <TextButton text={this.props.text}/>
        </Pressable>
      </TouchableNativeFeedback>
    )
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 4,
  },
})

export default ButtonAva
