import React, {Component} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
  size?: number,
  textAlign?: "center" | "right",
  type?: "import" | "export",
}
type State = {
  isDarkMode: boolean,
}

class TextAmount extends Component<Props, State> {
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
    let color = THEME.primaryColor
    if (this.props.type) {
      switch (this.props.type) {
        case "import":
          color = THEME.incoming
          break
        case "export":
          color = THEME.outgoing
          break
      }
    }
    return (
      <Text
        style={[
          {
            color: color,
            fontSize: this.props.size ? this.props.size : 16,
            fontFamily: "Rubik-Regular",
            textAlign: this.props.textAlign
          },
        ]}>
        {this.props.text}
      </Text>
    )
  }
}

export default TextAmount
