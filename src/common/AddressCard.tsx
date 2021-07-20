import React, {useState} from "react"
import {Appearance, Share, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "./Constants"
import TextTitle from "./TextTitle"
import QRCode from "react-native-qrcode-svg"
import ButtonAva from "./ButtonAva"

type Props = {
  title: string,
  address: string,
}

export default function AddressCard(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)

  const onShare = (address: string): void => {
    Share.share({
      title: "title",
      message: address,
    }, {
      dialogTitle: "dialog Title",
    }).then(value => console.log(value))
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  const qr = props.address ? <QRCode value={props.address}/> : undefined

  return (
    <View style={[{
      backgroundColor: THEME.bgLight,
      flex: 1,
      height: 100,
    }]}>
      <View style={[{margin: 10}]}>
        <TextTitle text={props.title} size={18}/>
      </View>
      <View style={styles.horizontalLayout}>
        <View style={[{margin: 10}]}>
          {qr}
        </View>
        <View style={[{margin: 10, flexShrink: 1}]}>
          <TextTitle text={props.address} size={18}/>
        </View>
      </View>
      <ButtonAva text={"Share"} onPress={() => onShare(props.address)}/>
    </View>
  )
}


const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
  },
})

