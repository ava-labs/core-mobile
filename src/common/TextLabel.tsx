import React, {useState} from "react"
import {Appearance, Text} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"

type Props = {
  text: string,
}

export default function TextLabel(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS
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
      {props.text}
    </Text>
  )
}

