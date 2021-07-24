import React, {useState} from 'react'
import {Alert, ScrollView, StyleSheet, View} from 'react-native'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import {AsyncSubject} from "rxjs"
import PolyfillCrypto from "react-native-webview-crypto"
import LoginViewModel, {DocPickEvents, Finished, PasswordPrompt} from "./LoginViewModel"
import PasswordInput from "../common/PasswordInput"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onBack: () => void,
}

export default function KeystoreLogin(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new LoginViewModel())
  const [prompt, setPrompt] = useState<AsyncSubject<string>>()
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)

  const onBack = (): void => {
    props.onBack()
  }

  const onDocumentPick = (): void => {
    viewModel.onDocumentPick().subscribe({
      next: (value: DocPickEvents) => {
        if (value instanceof PasswordPrompt) {
          setPrompt(value.prompt)
          setShowPasswordPrompt(true)
        } else if (value instanceof Finished) {
          props.onEnterWallet(value.mnemonic)
        }
      },
      error: err => Alert.alert("Error", err)
    })
  }

  const onOk = (password?: string): void => {
    prompt?.next(password || "")
    prompt?.complete()
    setPrompt(undefined)
    setShowPasswordPrompt(false)
  }

  const onCancel = (): void => {
    prompt?.error("User canceled")
    setPrompt(undefined)
    setShowPasswordPrompt(false)
  }

  const pwdInput = showPasswordPrompt && <PasswordInput onOk={onOk} onCancel={onCancel}/>

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
      <View style={styles.verticalLayout}>
        <Header showBack onBack={onBack}/>
        <View style={[{height: 8}]}/>

        {/*Needed by Wallet SDK for accessing keystore file*/}
        <PolyfillCrypto/>
        <TextTitle text={"Keystore wallet"} textAlign={"center"} bold={true}/>
        <View style={[{flexGrow: 1}]}/>
        <ButtonAva text={"Choose keystore file"} onPress={onDocumentPick}/>

        {pwdInput}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    height: "100%",
  },
  verticalLayout: {
    height: "100%",
    justifyContent: "flex-end",
  },
})
