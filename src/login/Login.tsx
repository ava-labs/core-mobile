import React, {useEffect, useState} from 'react'
import {Alert, ScrollView, StyleSheet, View} from 'react-native'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import {UserCredentials} from "react-native-keychain"
import BiometricsSDK from "../BiometricsSDK"
import WalletSDK from "../WalletSDK"
import {AsyncSubject, from} from "rxjs"
import PolyfillCrypto from "react-native-webview-crypto"
import LoginViewModel, {DocPickEvents, Finished, PasswordPrompt} from "./LoginViewModel"
import PasswordInput from "../common/PasswordInput"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onEnterSingletonWallet: (privateKey: string) => void,
  onBack: () => void,
}

export default function Login(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new LoginViewModel())
  const [prompt, setPrompt] = useState<AsyncSubject<string>>()
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [mnemonic, setMnemonic] = useState("")
  const [privateKey, setPrivateKey] = useState("PrivateKey-")
  // const [privateKey, setPrivateKey] = useState("27c9f8927ead18895542197939033a79a0060a98011b7ba022ddae33efcf82b5")
  // const [privateKey, setPrivateKey] = useState("PrivateKey-JXMcF4J7JAjVmQeeo9rXSRD8KeJefUFrd2Lgx59rEBN59WN4G")

  useEffect(() => {
    promptForWalletLoadingIfExists()
  }, [])

  const promptForWalletLoadingIfExists = () => {
    from(BiometricsSDK.loadWalletKey(BiometricsSDK.loadOptions)).subscribe({
      next: value => {
        if (value !== false) {
          const mnemonic = (value as UserCredentials).password
          props.onEnterWallet(mnemonic)
          setMnemonic(mnemonic)
        }
      },
      error: err => console.log(err.message)
    })
  }

  const onEnterTestWallet = (): void => {
    props.onEnterWallet(WalletSDK.testMnemonic())
  }

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
    <ScrollView>
      <View style={styles.verticalLayout}>
        <Header showBack onBack={onBack}/>
        <View style={[{height: 8}]}/>

        <TextTitle text={"HD Wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>
        <InputText
          onSubmit={() => props.onEnterWallet(mnemonic)}
          multiline={true}
          onChangeText={text => setMnemonic(text)}
          value={mnemonic}/>
        <ButtonAva text={"Enter HD wallet"} onPress={() => props.onEnterWallet(mnemonic)}/>

        <TextTitle text={"Singleton wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>
        <InputText
          multiline={true}
          onChangeText={text => setPrivateKey(text)}
          value={privateKey}/>
        <ButtonAva text={"Enter singleton wallet"}
                   onPress={() => props.onEnterSingletonWallet(privateKey)}/>

        {/*Needed by Wallet SDK for accessing keystore file*/}
        <PolyfillCrypto/>
        <TextTitle text={"Keystore wallet"} textAlign={"center"} bold={true}/>
        <View style={[{height: 8}]}/>
        <ButtonAva text={"Choose keystore file"} onPress={onDocumentPick}/>

        <ButtonAva text={"Enter test HD wallet"} onPress={onEnterTestWallet}/>

        {pwdInput}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
    verticalLayout: {
      justifyContent: "flex-end",
    },
  }
)
