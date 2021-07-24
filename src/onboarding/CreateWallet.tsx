import React, {useState} from 'react'
import {Appearance, Image, StyleSheet, ToastAndroid, View} from 'react-native'
import Header from '../mainView/Header'
import CreateWalletViewModel from './CreateWalletViewModel'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import Clipboard from "@react-native-clipboard/clipboard"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "../common/Constants"

type Props = {
  onBack: () => void,
  onSavedMyPhrase: (mnemonic: string) => void,
}

export default function CreateWallet(props: Props | Readonly<Props>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [viewModel] = useState(new CreateWalletViewModel())
  const [mnemonic, setMnemonic] = useState(viewModel.mnemonic)

  const onBack = (): void => {
    props.onBack()
  }

  const onSavedMyPhrase = (): void => {
    props.onSavedMyPhrase(viewModel.mnemonic)
  }

  const copyToClipboard = (): void => {
    Clipboard.setString(mnemonic)
    ToastAndroid.show("Copied", 1000)
  }

  const BalloonText = () => {
    const theme = commonViewModel.isDarkMode ? COLORS_NIGHT : COLORS
    const balloonArrow = require("../assets/icons/balloon_arrow.png")
    return <View style={[{marginTop: 24, alignItems: "center"}]}>
      <View style={[{
        marginHorizontal: 24,
        backgroundColor: theme.balloonBg,
        borderRadius: 8,
        padding: 12,
      }]}>
        <TextTitle
          color={theme.balloonText}
          text={"The recovery phrase is the only key to your wallet. Do not share it with anyone. Write it down and store it in a secure location!"}
          lineHeight={24} size={16}/>
      </View>
      <Image source={balloonArrow}/>
    </View>
  }

  return (
    <View style={styles.verticalLayout}>
      <Header showBack onBack={onBack}/>
      <View style={[{height: 8}]}/>

      <View style={styles.growContainer}>
        <TextTitle text={"Recovery Phrase"} textAlign={"center"} bold size={24}/>
        <TextTitle text={"Write down the recovery phrase"} size={16} textAlign={"center"}/>
        <BalloonText/>
        <View style={[{height: 8}]}/>
        <InputText multiline={true} value={mnemonic} editable={false}/>
        <ButtonAva text={"Copy to clipboard"} onPress={copyToClipboard}/>
      </View>

      <ButtonAva text={"I saved my phrase somewhere safe"} onPress={onSavedMyPhrase}/>
    </View>
  )
}

const styles = StyleSheet.create({
    verticalLayout: {
      height: "100%",
      justifyContent: "flex-end",
    },
    growContainer: {
      flexGrow: 1,
    },
  }
)
