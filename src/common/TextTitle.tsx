import React, {Component} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
  size?: number,
  bold?: boolean,
  textAlign?: "center" | "right",
}
type State = {
  isDarkMode: boolean,
}

class TextTitle extends Component<Props, State> {
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
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <Text
        style={[
          {
            color: THEME.primaryColor,
            fontSize: this.props.size ? this.props.size : 26,
            fontFamily: "Rubik",
            fontWeight: this.props.bold ? "bold" : "normal",
            textAlign: this.props.textAlign
          },
        ]}>
        {this.props.text}
      </Text>
    )
  }
}

export default TextTitle
