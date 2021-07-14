import React, {Component} from 'react'
import {Alert, Appearance, Modal, SafeAreaView, ScrollView, StyleSheet} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Loader from "../common/Loader"
import ValidateViewModel from "./ValidateViewModel"
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ValidateConfirm from "./ValidateConfirm"
import {debounceTime} from "rxjs/operators"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"
import InputText from "../common/InputText"
import ButtonAva from "../common/ButtonAva"
import Header from "../mainView/Header"
import {WalletProvider} from "@avalabs/avalanche-wallet-sdk/dist/Wallet/Wallet"

type Props = {
  wallet: WalletProvider,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  loaderVisible: boolean,
  loaderMsg: string,
  backgroundStyle: any,
  nodeId: string,
  endDate: string,
  stakingDuration: string,
  endDatePickerVisible: boolean,
  stakeAmount: string,
  delegationFee: string,
  rewardAddress: string,
  validateConfirmVisible: boolean,
}

class Validate extends Component<Props, State> {
  viewModel!: ValidateViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      loaderVisible: false,
      loaderMsg: '',
      backgroundStyle: {},
      nodeId: 'NodeID-',
      endDatePickerVisible: false,
      endDate: '',
      stakingDuration: '',
      stakeAmount: '0.00',
      delegationFee: '2',
      rewardAddress: '2',
      validateConfirmVisible: false,
    }
    this.viewModel = new ValidateViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.loaderVisible.pipe(
      debounceTime(300) //fixes problem with loader hanging if setstate changes state too quickly
    ).subscribe(value => this.setState({loaderVisible: value}))
    this.viewModel.loaderMsg.subscribe(value => this.setState({loaderMsg: value}))
    this.viewModel.endDate.subscribe(value => this.setState({endDate: value.toLocaleString()}))
    this.viewModel.stakingDuration.subscribe(value => this.setState({stakingDuration: value}))
    this.viewModel.endDatePickerVisible.subscribe(value => this.setState({endDatePickerVisible: value}))
    this.setRewardAddressToThisWallet()
  }

  componentWillUnmount(): void {
    this.viewModel.cleanup()
  }

  setRewardAddressToThisWallet(): void {
    this.setState({rewardAddress: this.viewModel.wallet.value.getAddressP()})
  }

  setEndDate(date: Date): void {
    this.viewModel.setEndDate(date).subscribe({
      error: err => Alert.alert("Error", err.message),
      complete: () => this.setState({endDatePickerVisible: false})
    })
  }

  onConfirm(): void {
    this.setState({validateConfirmVisible: true})
  }

  onSubmit(): void {
    this.setState({validateConfirmVisible: false})
    this.viewModel.submitValidator(
      this.state.nodeId,
      this.state.stakeAmount,
      this.viewModel.startDate.value.toLocaleString(),
      this.state.endDate,
      this.state.delegationFee,
      this.state.rewardAddress
    )
      .subscribe({
        error: err => Alert.alert("Error", err.message),
        complete: () => Alert.alert("Finished")
      })
  }

  render(): Element {

    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <ScrollView>
          <Header showBack onBack={this.props.onClose}/>
          <TextTitle text={"Validate"}/>
          <TextTitle text={"Node ID:"} size={18}/>
          <InputText value={this.state.nodeId} onChangeText={text => this.setState({nodeId: text})}/>

          <TextTitle text={"Staking End Date:"} size={18}/>
          <ButtonAva
            text={this.state.endDate}
            onPress={() => this.setState({endDatePickerVisible: true})}/>
          <DateTimePickerModal
            isVisible={this.state.endDatePickerVisible}
            mode="datetime"
            onConfirm={date => this.setEndDate(date)}
            onCancel={date => this.setState({endDatePickerVisible: false})}
          />

          <TextTitle text={"Staking Duration:"} size={18}/>
          <TextTitle text={this.state.stakingDuration} size={18} bold={true}/>

          <TextTitle text={"Stake amount:"} size={18}/>
          <InputAmount onChangeText={text => this.setState({stakeAmount: text})}/>

          <TextTitle text={"Delegation fee (%):"} size={18}/>
          <InputAmount initValue={this.state.delegationFee}
                       onChangeText={text => this.setState({delegationFee: text})}/>

          <TextTitle text={"Reward Address:"} size={18}/>
          <InputText value={this.state.rewardAddress} onChangeText={text => this.setState({rewardAddress: text})}/>

          <ButtonAva
            text={'Set to this wallet'}
            onPress={() => this.setRewardAddressToThisWallet()}/>
          <ButtonAva
            text={'Custom address'}
            onPress={() => this.setState({rewardAddress: ""})}/>
          <ButtonAva text={'Confirm'} onPress={() => this.onConfirm()}/>


          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.validateConfirmVisible}>
            <ValidateConfirm nodeId={this.state.nodeId} stakingAmount={this.state.stakeAmount}
                             endDate={this.state.endDate} delegationFee={this.state.delegationFee}
                             rewardAddress={this.state.rewardAddress} onSubmit={() => this.onSubmit()}
                             onClose={() => this.setState({validateConfirmVisible: false})}/>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.loaderVisible}>
            <Loader message={this.state.loaderMsg}/>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
    horizontalLayout: {
      flexDirection: 'row',
      justifyContent: "space-evenly",
    },
  }
)

export default Validate
