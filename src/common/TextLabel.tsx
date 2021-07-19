import React, {Component} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
}
type State = {
  isDarkMode: boolean,
}

class TextLabel extends Component<Props, State> {
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
        numberOfLines={1}
        style={[
          {
            color: THEME.primaryColorLight,
            fontSize: 13,
            fontFamily: "Inter-Regular"
          },
        ]}>
        {this.props.text}
      </Text>
    )
  }
}

export default TextLabel
