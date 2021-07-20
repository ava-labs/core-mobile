import React, {useEffect, useState} from "react"
import {StyleSheet, View} from "react-native"
import BalancesViewModel from "./BalancesViewModel"
import TextLabel from "../common/TextLabel"
import TextAmount from "../common/TextAmount"
import {asyncScheduler, BehaviorSubject, Subscription} from "rxjs"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"
import {subscribeOn} from "rxjs/operators"

type Props = {
  wallet: BehaviorSubject<WalletProvider>,
}

export default function Balances(props: Props | Readonly<Props>) {
  console.log("Balances")
  const [viewModel] = useState(new BalancesViewModel(props.wallet))
  const [availableX, setAvailableX] = useState("-- AVAX")
  const [availableP, setAvailableP] = useState("-- AVAX")
  const [lockedX, setLockedX] = useState("-- AVAX")
  const [lockedP, setLockedP] = useState("-- AVAX")
  const [lockedStakeable, setLockedStakeable] = useState("-- AVAX")
  const [availableC, setAvailableC] = useState("-- AVAX")
  const [stakingAmount, setStakingAmount] = useState("-- AVAX")
  const [availableTotal, setAvailableTotal] = useState("-- AVAX")

  useEffect(() => {
    const disposables = new Subscription()
    disposables.add(viewModel.availableX.pipe(subscribeOn(asyncScheduler)).subscribe(value => setAvailableX(value)))
    disposables.add(viewModel.availableP.pipe(subscribeOn(asyncScheduler)).subscribe(value => setAvailableP(value)))
    disposables.add(viewModel.availableC.pipe(subscribeOn(asyncScheduler)).subscribe(value => setAvailableC(value)))
    disposables.add(viewModel.stakingAmount.pipe(subscribeOn(asyncScheduler)).subscribe(value => setStakingAmount(value)))
    disposables.add(viewModel.availableTotal.pipe(subscribeOn(asyncScheduler)).subscribe(value => setAvailableTotal(value)))

    return () => {
      disposables.unsubscribe()
    }

  }, [])

  useEffect(() => {
    viewModel.onComponentMount()
    return () => {
      viewModel.onComponentUnMount()
    }
  }, [props.wallet])


  return (
    <View>
      <TextAmount text={availableTotal} size={36} textAlign={"center"}/>
      <View style={styles.horizontalLayout}>
        <View style={styles.column}>
          <TextLabel text={"Available (X)"}/>
          <TextAmount text={availableX}/>
          <TextLabel text={"Available (P)"}/>
          <TextAmount text={availableP}/>
          <TextLabel text={"Available (C)"}/>
          <TextAmount text={availableC}/>
        </View>
        <View style={styles.column}>
          <TextLabel text={"Locked (X)"}/>
          <TextAmount text={lockedX}/>
          <TextLabel text={"Locked (P)"}/>
          <TextAmount text={lockedP}/>
          <TextLabel text={"Locked Stakeable"}/>
          <TextAmount text={lockedStakeable}/>
        </View>
        <View style={styles.column}>
          <TextLabel text={"Staking"}/>
          <TextAmount text={stakingAmount}/>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    padding: 8,
  },
  column: {
    flex: 1,
  },
})
