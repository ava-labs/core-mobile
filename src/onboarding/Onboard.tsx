import React, {useEffect, useState} from 'react'
import {Image, StyleSheet, View} from 'react-native'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import TextLabel from "../common/TextLabel"
import OnboardViewModel, {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  WalletLoadingResults
} from "./OnboardViewModel"
import {Subscription} from "rxjs"

type Props = {
  onCreateWallet: () => void,
  onAlreadyHaveWallet: () => void,
  onEnterWallet: (mnemonic: string) => void,
  onEnterSingletonWallet: (privateKey: string) => void,
}

const pkg = require('../../package.json')

export default function Onboard(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new OnboardViewModel())
  const [showButtons, setShowButtons] = useState(false)

  useEffect(() => {
    const disposables = new Subscription()
    disposables.add(viewModel.showButtons.subscribe(value => setShowButtons(value)))
    viewModel.promptForWalletLoadingIfExists().subscribe({
      next: (value: WalletLoadingResults) => {
        if (value instanceof MnemonicLoaded) {
          props.onEnterWallet(value.mnemonic)
        } else if (value instanceof PrivateKeyLoaded) {
          props.onEnterSingletonWallet(value.privateKey)
        } else if (value instanceof NothingToLoad) {
          //do nothing
        }
      },
      error: err => console.log(err.message)
    })
    return () => {
      disposables.unsubscribe()
    }
  }, [])

  const onCreateWallet = (): void => {
    props.onCreateWallet()
  }

  const onAlreadyHaveWallet = (): void => {
    props.onAlreadyHaveWallet()
  }

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.logoContainer}>
        <Image
          accessibilityRole="image"
          source={require('../assets/AvaLogo.png')}
          style={styles.logo}/>
        <TextTitle text={"Avalanche Wallet"} textAlign={"center"} bold={true}/>
      </View>
      {showButtons && <ButtonAva text={"Create wallet"} onPress={() => onCreateWallet()}/>}
      {showButtons &&
      <ButtonAva text={"I already have wallet"} onPress={() => onAlreadyHaveWallet()}/>}
      <TextLabel text={"v" + pkg.version}/>
    </View>
  )
}


const styles = StyleSheet.create({
    verticalLayout: {
      height: "100%",
      justifyContent: "flex-end",
    },
    logoContainer: {
      flexGrow: 1,
      justifyContent: "center"
    },
    logo: {
      marginTop: 0,
      height: 50,
      width: "100%",
      resizeMode: 'contain',
    },
  }
)
