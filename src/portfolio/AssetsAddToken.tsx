import React, {useEffect, useState} from "react"
import {Alert, Appearance, SafeAreaView, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import TextTitle from "../common/TextTitle"
import Header from "../mainView/Header"
import AssetsAddTokenViewModel from "./AssetsAddTokenViewModel"
import InputText from "../common/InputText"
import {BehaviorSubject} from "rxjs"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import ButtonAva from "../common/ButtonAva"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

type Props = {
  wallet: BehaviorSubject<WalletProvider>,
  onClose: () => void,
}

export default function AssetsAddToken(props: Props | Readonly<Props>) {

  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [viewModel] = useState(new AssetsAddTokenViewModel(props.wallet))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [backgroundStyle] = useState(commonViewModel.backgroundStyle)
  const [tokenContractAddress, setTokenContractAddress] = useState("")
  const [tokenName, setTokenName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [tokenDecimals, setTokenDecimals] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [addTokenBtnDisabled, setAddTokenBtnDisabled] = useState(true)

  useEffect(() => {
    viewModel.tokenContractAddress.subscribe(value => setTokenContractAddress(value))
    viewModel.tokenName.subscribe(value => setTokenName(value))
    viewModel.tokenDecimals.subscribe(value => setTokenDecimals(value))
    viewModel.tokenSymbol.subscribe(value => setTokenSymbol(value))
    viewModel.errorMsg.subscribe(value => setErrorMsg(value))
    viewModel.addTokenBtnDisabled.subscribe(value => setAddTokenBtnDisabled(value))
  }, [])

  const setContractAddress = (address: string): void => {
    viewModel.setAddress(address)
  }

  const onAddToken = (): void => {
    viewModel.onAddToken().subscribe({
      error: err => Alert.alert("Error", err.message),
      complete: () => Alert.alert("Success", "", [
        {text: 'Ok', onPress: () => props.onClose()},
      ])
    })
  }

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS
  return (

    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose}/>
      <TextTitle text={"Add Token"}/>
      <TextTitle text={"Token Contract Address"} size={18}/>
      <InputText
        multiline={true}
        onChangeText={text => setContractAddress(text)}
        value={tokenContractAddress}/>

      <TextTitle textAlign={"center"} text={errorMsg} size={18} color={THEME.error}/>

      <TextTitle text={"Token Name"} size={18}/>
      <InputText
        editable={false}
        multiline={true}
        value={tokenName}/>

      <TextTitle text={"Token Symbol"} size={18}/>
      <InputText
        editable={false}
        multiline={true}
        value={tokenSymbol}/>

      <TextTitle text={"Decimals of Precision"} size={18}/>
      <InputText
        editable={false}
        multiline={true}
        value={tokenDecimals}/>

      <View style={[{flexGrow: 1, justifyContent: "flex-end"}]}>
        <ButtonAva disabled={addTokenBtnDisabled} text={"Add token"}
                   onPress={onAddToken}/>
      </View>

    </SafeAreaView>
  )
}

