import React from 'react'
import {Alert, Appearance, Image, StyleSheet, View} from 'react-native'
import TextTitle from "../common/TextTitle"
import TextLabel from "../common/TextLabel"
import ButtonAvaTextual from "../common/ButtonAvaTextual"
import ButtonAva from "../common/ButtonAva"
import {useBiometricLogin} from "./BiometricLoginViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import CommonViewModel from "../CommonViewModel"


type Props = {
  wallet: MnemonicWallet,
  onSkip: () => void,
  onBiometrySet: () => void,
}

export default function BiometricLogin(props: Props | Readonly<Props>) {

  const commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  const [
    biometryType,
    onUseBiometry,
    fingerprintIcon
  ] = useBiometricLogin(props.wallet, commonViewModel.isDarkMode)

  return (
    <View style={styles.verticalLayout}>
      <View style={styles.centerLayout}>
        <Image source={fingerprintIcon} style={[{
          width: 120,
          height: 120,
        }]}/>
        <View style={[{height: 90}]}/>
        <TextTitle text={"Biometric Login"} size={24} bold/>
        <TextLabel text={"Sign in quickly using your " + biometryType?.toLowerCase()}/>
        <TextLabel text={"Change this anytime in settings"}/>
      </View>

      <ButtonAvaTextual text={"Skip"} onPress={props.onSkip}/>
      <ButtonAva text={"Use " + biometryType?.toLowerCase()} onPress={() => {
        onUseBiometry().subscribe({
          error: err => Alert.alert(err?.message || "error"),
          complete: () => props.onBiometrySet()
        })
      }}/>
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    justifyContent: "flex-end",
    height: "100%",
  },
  centerLayout: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  },
})
