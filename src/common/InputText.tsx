import React, {Component} from "react"
import {
  Appearance,
  NativeSyntheticEvent,
  StyleProp,
  TextInput,
  TextInputSubmitEditingEventData,
  TextStyle
} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  value: string,
  onChangeText?: (text: string) => void
  textSize?: number,
  editable?: boolean,
  multiline?: boolean,
  style?: StyleProp<TextStyle>
  onSubmit?: () => void
}
type State = {
  isDarkMode: boolean,
}

class InputText extends Component<Props, State> {
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

  private onSubmit = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>): void => {
      this.props.onSubmit?.()
  }

  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <TextInput
        blurOnSubmit={true}
        onSubmitEditing={this.onSubmit}
        returnKeyType={this.props.onSubmit && "go"}
        enablesReturnKeyAutomatically={true}
        editable={this.props.editable !== false}
        multiline={this.props.multiline ? this.props.multiline : false}
        style={[
          {
            color: THEME.primaryColor,
            fontSize: this.props.textSize ? this.props.textSize : 18,
            borderWidth: 1,
            borderColor: THEME.primaryColorLight,
            borderRadius: 4,
            margin: 12,
            padding: 8,
            fontFamily: "Inter-Regular",
          },
          this.props.style
        ]}
        onChangeText={this.props.onChangeText}
        value={this.props.value}/>
    )
  }
}

export default InputText
