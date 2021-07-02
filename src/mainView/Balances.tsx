import React, {Component} from "react"
import {Appearance, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import BalancesViewModel from "./BalancesViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import TextLabel from "../common/TextLabel"
import TextAmount from "../common/TextAmount"

type Props = {
  wallet: MnemonicWallet,
}
type State = {
  isDarkMode: boolean
  availableTotal: string
  availableX: string
  availableP: string
  availableC: string
  stakingAmount: string
  lockedX: string
  lockedP: string
  lockedStakeable: string
}

class Balances extends Component<Props, State> {
  viewModel!: BalancesViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      availableTotal: "-- AVAX",
      availableX: "-- AVAX",
      availableP: "-- AVAX",
      availableC: "-- AVAX",
      stakingAmount: "-- AVAX",
      lockedX: "0 AVAX",
      lockedP: "0 AVAX",
      lockedStakeable: "0 AVAX",
    }
    this.viewModel = new BalancesViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.viewModel.availableX.subscribe(value => this.setState({availableX: value}))
    this.viewModel.availableP.subscribe(value => this.setState({availableP: value}))
    this.viewModel.availableC.subscribe(value => this.setState({availableC: value}))
    this.viewModel.stakingAmount.subscribe(value => this.setState({stakingAmount: value}))
    this.viewModel.availableTotal.subscribe(value => this.setState({availableTotal: value}))
    this.viewModel.onComponentMount()
  }

  onComponentUnMount = (): void => {
    this.viewModel.onComponentUnMount()
  }

  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS

    return (
      <View>
        <TextAmount text={this.state.availableTotal} size={36} textAlign={"center"}/>
        <View style={styles.horizontalLayout}>
          <View style={styles.column}>
            <TextLabel text={"Available (X)"}/>
            <TextAmount text={this.state.availableX}/>
            <TextLabel text={"Available (P)"}/>
            <TextAmount text={this.state.availableP}/>
            <TextLabel text={"Available (C)"}/>
            <TextAmount text={this.state.availableC}/>
          </View>
          <View style={styles.column}>
            <TextLabel text={"Locked (X)"}/>
            <TextAmount text={this.state.lockedX}/>
            <TextLabel text={"Locked (P)"}/>
            <TextAmount text={this.state.lockedP}/>
            <TextLabel text={"Locked Stakeable"}/>
            <TextAmount text={this.state.lockedStakeable}/>
          </View>
          <View style={styles.column}>
            <TextLabel text={"Staking"}/>
            <TextAmount text={this.state.stakingAmount}/>
          </View>
        </View>
      </View>
    )
  }
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
export default Balances
