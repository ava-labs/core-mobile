import React, {useState} from "react"
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

export default function InputAmount(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [decreaseBtnVisible] = useState(!!props.showControls,)
  const [increaseBtnVisible] = useState(!!props.showControls,)
  const [value, setValue] = useState(props.initValue ? props.initValue : "0.00",)


  const decreaseAmount = (): void => {
    let newVal = parseFloat(value) - 0.1
    if (newVal < 0) newVal = 0
    let newState = newVal.toFixed(2).toString()
    setValue(newState)
    props.onChangeText?.(newState)
  }

  const increaseAmount = (): void => {
    let newVal = parseFloat(value) + 0.1
    let newState = newVal.toFixed(2).toString()
    setValue(newState)
    props.onChangeText?.(newState)
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  const decreaseIcon = isDarkMode ? require("../assets/icons/remove_dark.png") : require("../assets/icons/remove_light.png")
  const increaseIcon = isDarkMode ? require("../assets/icons/add_dark.png") : require("../assets/icons/add_light.png")
  const decreaseBtn = decreaseBtnVisible && <ImgButtonAva src={decreaseIcon} onPress={() => decreaseAmount()}/>
  const increaseBtn = increaseBtnVisible && <ImgButtonAva src={increaseIcon} onPress={() => increaseAmount()}/>
  return (
    <View style={styles.horizontalLayout}>
      {decreaseBtn}
      <TextInput
        keyboardType={"numeric"}
        editable={props.editable !== false}
        style={[
          {
            flexGrow: 1,
            color: THEME.primaryColor,
            fontSize: props.textSize ? props.textSize : 18,
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
          setValue(text)
          props.onChangeText?.(text)
        }}
        value={value}/>
      {increaseBtn}
    </View>

  )
}


const styles: any = StyleSheet.create({
  horizontalLayout: {
    flexDirection: "row",
    alignItems: "center",
  },
})
