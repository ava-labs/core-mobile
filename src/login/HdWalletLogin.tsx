import React, {useState} from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import WalletSDK from "../WalletSDK"
import ButtonAvaSecondary from "../common/ButtonAvaSecondary"

type Props = {
  onEnterWallet: (mnemonic: string) => void,
  onBack: () => void,
}

export default function HdWalletLogin(props: Props | Readonly<Props>) {
  const [mnemonic, setMnemonic] = useState("")


  const onEnterTestWallet = (): void => {
    props.onEnterWallet(WalletSDK.testMnemonic())
  }

  const onBack = (): void => {
    props.onBack()
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollView}>
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
        <View style={[{flexGrow: 1}]}/>
        <ButtonAva text={"Enter HD wallet"} onPress={() => props.onEnterWallet(mnemonic)}/>

        <ButtonAvaSecondary text={"Enter test HD wallet"} onPress={onEnterTestWallet}/>
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
  }
)
