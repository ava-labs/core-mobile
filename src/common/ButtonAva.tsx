import React, {useState} from "react"
import {Appearance, StyleSheet, TouchableNativeFeedback, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextButton from "./TextButton"
import {PlatformRules} from "./PlatformRules"

type Props = {
  text: string,
  onPress: () => void,
  disabled?: boolean
}

export default function ButtonAva(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  const onPress = () => {
    PlatformRules.delayedPress(props.onPress)
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <TouchableNativeFeedback
      disabled={props.disabled}
      useForeground={true}
      onPress={() => onPress()}
      background={TouchableNativeFeedback.Ripple(THEME.onPrimary, false)}>
      <View style={[styles.button, {backgroundColor: THEME.primaryColor}]}>
        <TextButton disabled={props.disabled} text={props.text}/>
      </View>
    </TouchableNativeFeedback>
  )
}


const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    margin: 10,
    borderRadius: 4,
  },
})

