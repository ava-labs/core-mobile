import React, {useState} from 'react'
import {StyleSheet, ToastAndroid, View} from 'react-native'
import Header from '../mainView/Header'
import CreateWalletViewModel from './CreateWalletViewModel'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import Clipboard from "@react-native-clipboard/clipboard"

type Props = {
  onBack: () => void,
  onSavedMyPhrase: (mnemonic: string) => void,
}

export default function CreateWallet(props: Props | Readonly<Props>) {
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

  return (
    <View style={styles.verticalLayout}>
      <Header showBack onBack={onBack}/>
      <View style={[{height: 8}]}/>

      <View style={styles.growContainer}>
        <TextTitle text={"Here are your 24 word key phrase."} size={20}
                   textAlign={"center"}/>
        <TextTitle text={"Please store it somewhere safe."} size={20}
                   textAlign={"center"}/>
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
      justifyContent: "center"
    },
  }
)
