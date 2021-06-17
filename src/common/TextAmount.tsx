import React, {Component} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
  size?: number,
  textAlign?: "center" | "right",
}
type State = {
  isDarkMode: boolean,
}

class TextAmount extends Component<Props, State> {
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
    return (
      <Text
        style={[
          {
            color: this.state.isDarkMode ? COLORS_NIGHT.primaryColor : COLORS.primaryColor,
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
