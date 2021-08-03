import React, {useEffect, useState} from "react"
import {Alert, Appearance, Modal, SafeAreaView, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"
import Loader from "../common/Loader"
import SendAvaxXViewModel from "./SendAvaxXViewModel"
import QrScannerAva from "../common/QrScannerAva"
import Header from "../mainView/Header"
import ImgButtonAva from "../common/ImgButtonAva"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"

type SendAvaxXProps = {
  wallet: MnemonicWallet,
  onClose: () => void,
}

export default function SendAvaxX(props: SendAvaxXProps | Readonly<SendAvaxXProps>) {
  const [commonViewModel] = useState(new CommonViewModel(Appearance.getColorScheme()))
  const [viewModel] = useState(new SendAvaxXViewModel(props.wallet))
  const [isDarkMode] = useState(commonViewModel.isDarkMode)
  const [cameraVisible, setCameraVisible] = useState(false)
  const [loaderVisible, setLoaderVisible] = useState(false)
  const [loaderMsg, setLoaderMsg] = useState('')
  const [backgroundStyle] = useState(commonViewModel.backgroundStyle)
  const [addressXToSendTo, setAddressXToSendTo] = useState('')
  const [sendAmount, setSendAmount] = useState('0.00')

  useEffect(() => {
    viewModel.loaderMsg.subscribe(value => setLoaderMsg(value))
    viewModel.loaderVisible.subscribe(value => setLoaderVisible(value))
    viewModel.cameraVisible.subscribe(value => setCameraVisible(value))
    viewModel.addressXToSendTo.subscribe(value => setAddressXToSendTo(value))
  }, [])

  const onSend = (addressX: string, amount: string): void => {
    viewModel.onSendAvaxX(addressX, amount)
      .subscribe({
        next: txHash => {
          Alert.alert("Success", "Created transaction: " + txHash)
        },
        error: err => Alert.alert("Error", err.message),
        complete: () => {
        },
      })
  }

  const ClearBtn = () => {
    const clearIcon = isDarkMode ? require("../assets/icons/clear_dark.png") : require("../assets/icons/clear_light.png")
    return <View style={styles.clear}>
      <ImgButtonAva src={clearIcon} onPress={() => viewModel.clearAddress()}/>
    </View>
  }

  const scanIcon = isDarkMode ? require("../assets/icons/qr_scan_dark.png") : require("../assets/icons/qr_scan_light.png")
  const clearBtn = addressXToSendTo.length != 0 && ClearBtn()

  return (

    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose}/>
      <TextTitle text={"Send AVAX (X Chain)"}/>
      <TextTitle text={"To:"} size={18}/>

      <View style={styles.horizontalLayout}>
        <InputText
          style={[{flex: 1}]}
          multiline={true}
          onChangeText={text => setAddressXToSendTo(text)}
          value={addressXToSendTo}/>
        {clearBtn}
        <ImgButtonAva src={scanIcon} onPress={() => viewModel.onScanBarcode()}/>
      </View>

      <TextTitle text={"Amount:"} size={18}/>
      <InputAmount
        showControls={true}
        onChangeText={text => setSendAmount(text)}/>

      <ButtonAva text={'Send'} onPress={() => onSend(addressXToSendTo, sendAmount)}/>

      <Modal
        animationType="fade"
        transparent={true}
        visible={loaderVisible}>
        <Loader message={loaderMsg}/>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCameraVisible(false)}
        visible={cameraVisible}>
        <QrScannerAva onSuccess={data => viewModel.onBarcodeScanned(data)}
                      onCancel={() => setCameraVisible(false)}/>
      </Modal>

    </SafeAreaView>
  )
}


const styles: any = StyleSheet.create({
  horizontalLayout: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  clear: {
    position: "absolute",
    end: 58,
  },
})

