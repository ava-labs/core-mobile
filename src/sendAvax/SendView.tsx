import React, {useState} from "react"
import {Modal, StyleSheet, View} from "react-native"
import SendAvaxX from "../sendAvax/SendAvaxX"
import SendAvaxC from "../sendAvax/SendAvaxC"
import SendCrossChain from "../sendAvax/SendCrossChain";
import ButtonAva from "../common/ButtonAva"
import Header from "../mainView/Header"
import SendViewModel from "./SendViewModel"
import TextTitle from "../common/TextTitle"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"

type Props = {
  wallet: MnemonicWallet,
}

export default function SendView(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new SendViewModel(props.wallet))
  const [sendXVisible, setSendXVisible] = useState(false)
  const [sendCVisible, setSendCVisible] = useState(false)
  const [crossChainVisible, setCrossChainVisible] = useState(false)

  return (
    <View style={styles.container}>
      <Header/>
      <TextTitle text={"Send"}/>
      <View style={styles.buttons}>
        <ButtonAva
          text={"Send AVAX X"}
          onPress={() => setSendXVisible(true)}/>
        <ButtonAva
          text={"Send AVAX C"}
          onPress={() => setSendCVisible(true)}/>
        <ButtonAva
          text={"Cross chain"}
          onPress={() => setCrossChainVisible(true)}/>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={sendXVisible}
        onRequestClose={() => setSendXVisible(false)}>
        <SendAvaxX
          wallet={viewModel.wallet.value}
          onClose={() => {
            setSendXVisible(false)
          }}
        />
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={sendCVisible}
        onRequestClose={() => setSendCVisible(false)}>
        <SendAvaxC
          wallet={viewModel.wallet.value}
          onClose={() => {
            setSendCVisible(false)
          }}/>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={crossChainVisible}
        onRequestClose={() => setCrossChainVisible(false)}>
        <SendCrossChain
          wallet={viewModel.wallet.value}
          onClose={() => {
            setCrossChainVisible(false)
          }}/>
      </Modal>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingBottom: 88,
  },
  buttons: {
    height: "100%",
    justifyContent: "flex-end"
  }
})

