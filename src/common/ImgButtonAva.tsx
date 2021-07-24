import React, {useState} from "react"
import {Appearance, Image, ImageSourcePropType, StyleSheet, TouchableNativeFeedback, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import {PlatformRules} from "./PlatformRules"

type Props = {
  src: ImageSourcePropType,
  onPress: () => void,
  width?: number,
  height?: number,
}
export default function ImgButtonAva(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  const onPress = () => {
    PlatformRules.delayedPress(props.onPress)
  }

  let THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (

    <TouchableNativeFeedback
      useForeground={true}
      onPress={onPress}
      background={TouchableNativeFeedback.Ripple(THEME.primaryColor, true)}>
      <View style={styles.container}>
        <Image source={props.src} style={[styles.button, {width: props.width || 24, height: props.height || 24 }]}/>
      </View>
    </TouchableNativeFeedback>
  )
}


const styles = StyleSheet.create({
  container: {
    alignSelf: "baseline"
  },
  button: {
    margin: 10,
  },
})

