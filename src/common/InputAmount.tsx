import React, {Component} from "react"
import {Appearance, StyleSheet, TextInput, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import ButtonAva from "./ButtonAva"

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
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

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
    const decreaseBtn = this.state.decreaseBtnVisible ? <ButtonAva text={"-"} onPress={() => this.decreaseAmount()}/> : undefined
    const increaseBtn = this.state.increaseBtnVisible ? <ButtonAva text={"+"} onPress={() => this.increaseAmount()}/> : undefined
    return (
      <View style={styles.horizontalLayout}>
        {decreaseBtn}
        <TextInput
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
              fontFamily: "Rubik-Regular",
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
  },
})
export default InputAmount
