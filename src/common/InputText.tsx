import React, {useState} from "react"
import {Appearance, StyleProp, TextInput, TextStyle} from "react-native"
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

export default function InputText(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  const onSubmit = (): void => {
    props.onSubmit?.()
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (
    <TextInput
      blurOnSubmit={true}
      onSubmitEditing={onSubmit}
      returnKeyType={props.onSubmit && "go"}
      enablesReturnKeyAutomatically={true}
      editable={props.editable !== false}
      multiline={props.multiline ? props.multiline : false}
      style={[
        {
          color: THEME.primaryColor,
          fontSize: props.textSize ? props.textSize : 18,
          borderWidth: 1,
          borderColor: THEME.primaryColorLight,
          borderRadius: 4,
          margin: 12,
          padding: 8,
          fontFamily: "Inter-Regular",
        },
        props.style
      ]}
      onChangeText={props.onChangeText}
      value={props.value}/>
  )
}



