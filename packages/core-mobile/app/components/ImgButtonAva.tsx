import React from 'react'
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableNativeFeedback,
  View
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'

type Props = {
  src: ImageSourcePropType
  onPress: () => void
  width?: number
  height?: number
  testID?: string
}
export default function ImgButtonAva(props: Props | Readonly<Props>) {
  const context = useApplicationContext()
  const theme = context.theme
  return (
    <TouchableNativeFeedback
      useForeground={true}
      onPress={props.onPress}
      background={TouchableNativeFeedback.Ripple(theme.buttonRipple, true)}>
      <View style={styles.container}>
        <Image
          source={props.src}
          style={[
            styles.button,
            { width: props.width || 24, height: props.height || 24 }
          ]}
        />
      </View>
    </TouchableNativeFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'baseline'
  },
  button: {
    margin: 10
  }
})
