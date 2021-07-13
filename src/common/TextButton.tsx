import React, {Component} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
  disabled?: boolean
}
type State = {
  isDarkMode: boolean,
}

class TextButton extends Component<Props, State> {
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
      <Text
        style={[
          {
            color: this.props.disabled ? THEME.primaryColorLight : THEME.onPrimary,
            fontSize: 14,
            fontWeight: "700",
            textTransform: "uppercase",
            fontFamily: "Rubik-Regular",
            textAlign: "center",
          },
        ]}>
        {this.props.text}
      </Text>
    )
  }
}

export default TextButton
