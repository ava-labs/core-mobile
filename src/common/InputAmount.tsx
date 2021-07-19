import React, {Component} from "react"
import {Appearance, StyleSheet, TextInput, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import ImgButtonAva from "./ImgButtonAva"

type Props = {
  initValue?: string
  onChangeText?: (text: string) => void
  textSize?: number
  editable?: boolean
  showControls?: boolean
}
type State = {
  isDarkMode: boolean
  decreaseBtnVisible: boolean
  increaseBtnVisible: boolean
  value: string
}

class InputAmount extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      decreaseBtnVisible: !!props.showControls,
      increaseBtnVisible: !!props.showControls,
      value: props.initValue ? props.initValue : "0.00",
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  private decreaseAmount(): void {
    let newVal = parseFloat(this.state.value) - 0.1
    if (newVal < 0) newVal = 0
    let newState = newVal.toFixed(2).toString()
    this.setState({
      value: newState
    })
    this.props.onChangeText?.(newState)
  }

  private increaseAmount(): void {
    let newVal = parseFloat(this.state.value) + 0.1
    let newState = newVal.toFixed(2).toString()
    this.setState({
      value: newState
    })
    this.props.onChangeText?.(newState)
  }

  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    const decreaseIcon = this.state.isDarkMode ? require("../assets/icons/remove_dark.png") : require("../assets/icons/remove_light.png")
    const increaseIcon = this.state.isDarkMode ? require("../assets/icons/add_dark.png") : require("../assets/icons/add_light.png")
    const decreaseBtn = this.state.decreaseBtnVisible && <ImgButtonAva src={decreaseIcon} onPress={() => this.decreaseAmount()}/>
    const increaseBtn = this.state.increaseBtnVisible && <ImgButtonAva src={increaseIcon} onPress={() => this.increaseAmount()}/>
    return (
      <View style={styles.horizontalLayout}>
        {decreaseBtn}
        <TextInput
          keyboardType={"numeric"}
          editable={this.props.editable !== false}
          style={[
            {
              flexGrow: 1,
              color: THEME.primaryColor,
              fontSize: this.props.textSize ? this.props.textSize : 18,
              padding: 8,
              borderWidth: 1,
              borderColor: THEME.primaryColorLight,
              borderRadius: 4,
              margin: 12,
              textAlign: "right",
              fontFamily: "Inter-Regular",
            },
          ]}
          textAlign={"center"}
          onChangeText={text => {
            this.setState({value: text})
            this.props.onChangeText?.(text)
          }}
          value={this.state.value}/>
        {increaseBtn}
      </View>

    )
  }
}

const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
})
export default InputAmount
