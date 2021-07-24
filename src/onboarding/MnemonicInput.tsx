import React from "react"
import {StyleSheet, View} from "react-native"
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"

type Props = {
  keyNum: number
  text: string
  editable: boolean
  onChangeText?: (text: string) => void
}

export default function MnemonicInput(props: Props | Readonly<Props>) {
  return (
    <View style={styles.horizontalLayout}>
      <InputText value={props.text} style={{flexGrow: 1}}
                 editable={props.editable} onChangeText={props.onChangeText}/>
      <View style={styles.superscript}>
        <TextTitle text={(props.keyNum + 1).toString()} size={10}/>
      </View>
    </View>
  )
}


const styles: any = StyleSheet.create({
    superscript: {
      position: 'absolute',
      end: 14,
      top: 14,
    },
    horizontalLayout: {
      flexDirection: 'row',
      alignItems: "center",
      width: 116,
    },
  }
)
