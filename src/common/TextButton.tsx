import React, {useState} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
  disabled?: boolean
}

export default function TextButton(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <Text
      style={[
        {
          color: props.disabled ? THEME.primaryColorLight : THEME.onPrimary,
          fontSize: 14,
          fontWeight: "700",
          textTransform: "uppercase",
          fontFamily: "Inter-Regular",
          textAlign: "center",
        },
      ]}>
      {props.text}
    </Text>
  )
}

