import React, {useState} from "react"
import {Appearance, StyleSheet, TouchableNativeFeedback, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextButtonTextual from "./TextButtonTextual"

type Props = {
  text: string,
  onPress: () => void,
  disabled?: boolean
}

export default function ButtonAvaTextual(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <TouchableNativeFeedback
      disabled={props.disabled}
      useForeground={true}
      onPress={() => props.onPress()}
      background={TouchableNativeFeedback.Ripple(THEME.buttonRipple, false)}>
      <View style={[styles.button]}>
        <TextButtonTextual disabled={props.disabled} text={props.text}/>
      </View>
    </TouchableNativeFeedback>
  )
}


const styles = StyleSheet.create({
  button: {
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginHorizontal: 24,
    marginVertical: 8,
  },
})

