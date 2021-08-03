import React, {useEffect, useState} from "react"
import {StyleSheet, View} from "react-native"
import PortfolioViewModel from "./PortfolioViewModel"
import Header from "../mainView/Header"
import Balances from "../portfolio/Balances"
import TabbedAddressCards from "../portfolio/TabbedAddressCards"
import {BehaviorSubject, Subscription} from "rxjs"
import {MnemonicWallet, NetworkConstants} from "@avalabs/avalanche-wallet-sdk"
import {useAddresses} from "@avalabs/wallet-react-components/src/hooks/useAddresses"
import TextLabel from "../common/TextLabel"

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>,
  onExit: () => void,
  onSwitchWallet: () => void,
}

export default function PortfolioView(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new PortfolioViewModel(props.wallet))
  const [avaxPrice, setAvaxPrice] = useState(0)
  const {
    addressX,
    addressP,
    addressC
  } = useAddresses(props.wallet.value as MnemonicWallet, NetworkConstants.TestnetConfig)


  useEffect(() => {
    const disposables = new Subscription()
    disposables.add(viewModel.avaxPrice.subscribe(value => setAvaxPrice(value)))
    viewModel.onComponentMount()

    return () => {
      disposables.unsubscribe()
    }
  }, [])

  const onExit = (): void => {
    props.onExit()
  }

  const onSwitchWallet = (): void => {
    props.onSwitchWallet()
  }

  return (
    <View style={styles.container}>
      <Header showExit onExit={onExit} showSwitchWallet onSwitchWallet={onSwitchWallet}/>
      <Balances wallet={props.wallet}/>
      <TextLabel text={"Avax price = " + avaxPrice + "USD"}/>
      <TabbedAddressCards addressP={addressP} addressX={addressX} addressC={addressC}/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
})

