import React, {useEffect, useState} from "react"
import {StyleSheet, View} from "react-native"
import PortfolioViewModel from "./PortfolioViewModel"
import Header from "../mainView/Header"
import Balances from "../portfolio/Balances"
import TabbedAddressCards from "../portfolio/TabbedAddressCards"
import {BehaviorSubject, Subscription} from "rxjs"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

type Props = {
  wallet: BehaviorSubject<WalletProvider>,
  onExit: () => void,
  onSwitchWallet: () => void,
}

export default function PortfolioView(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new PortfolioViewModel(props.wallet))
  const [avaxPrice, setAvaxPrice] = useState(0)
  const [addressX, setAddressX] = useState("")
  const [addressP, setAddressP] = useState("")
  const [addressC, setAddressC] = useState("")
  const [sendXVisible, setSendXVisible] = useState(false)
  const [sendCVisible, setSendCVisible] = useState(false)
  const [crossChainVisible, setCrossChainVisible] = useState(false)
  const [walletCAddress, setWalletCAddress] = useState("")
  const [walletEvmAddress, setWalletEvmAddress] = useState("")

  useEffect(() => {
    const disposables = new Subscription()
    disposables.add(viewModel.avaxPrice.subscribe(value => setAvaxPrice(value)))
    disposables.add(viewModel.walletCAddress.subscribe(value => setWalletCAddress(value)))
    disposables.add(viewModel.walletEvmAddrBech.subscribe(value => setWalletEvmAddress(value)))
    disposables.add(viewModel.addressX.subscribe(value => setAddressX(value)))
    disposables.add(viewModel.addressP.subscribe(value => setAddressP(value)))
    disposables.add(viewModel.addressC.subscribe(value => setAddressC(value)))
    viewModel.onComponentMount()

    return () => {
      disposables.unsubscribe()
      viewModel.onComponentUnMount()
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
      <TabbedAddressCards addressP={addressP} addressX={addressX}
                          addressC={addressC}/>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
})

