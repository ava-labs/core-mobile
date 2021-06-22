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
            color: this.state.isDarkMode ? COLORS_NIGHT.primaryColorLight : COLORS.primaryColorLight,
            fontSize: 13,
            fontFamily: "Rubik-Regular"
          },
        ]}>
        {this.props.text}
      </Text>
    )
  }
}

export default TextLabel
