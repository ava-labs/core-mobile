import React, {Component} from 'react'
import {Alert, Appearance, Button, Modal, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'
import {MnemonicWallet} from '../../wallet_sdk';
import Loader from "../common/Loader"
import ValidateViewModel from "./ValidateViewModel"
import DateTimePickerModal from "react-native-modal-datetime-picker";
import ValidateConfirm from "./ValidateConfirm"

type ValidateProps = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type ValidateState = {
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

class Validate extends Component<ValidateProps, ValidateState> {
  viewModel!: ValidateViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: ValidateProps | Readonly<ValidateProps>) {
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
    this.viewModel.loaderVisible.subscribe(value => this.setState({loaderVisible: value}))
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

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Validate
        </Text>
        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Node ID:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => this.setState({nodeId: text})}
          value={this.state.nodeId}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Staking End Date:
        </Text>
        <Button
          title={this.state.endDate}
          onPress={ev => this.setState({endDatePickerVisible: true})}/>
        <DateTimePickerModal
          isVisible={this.state.endDatePickerVisible}
          mode="datetime"
          onConfirm={date => this.setEndDate(date)}
          onCancel={date => this.setState({endDatePickerVisible: false})}
        />

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Staking Duration: {"\n"}{this.state.stakingDuration}
        </Text>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Stake amount:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => this.setState({stakeAmount: text})}
          value={this.state.stakeAmount}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Delegation fee (%):
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => this.setState({delegationFee: text})}
          value={this.state.delegationFee}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Reward Address:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => this.setState({rewardAddress: text})}
          value={this.state.rewardAddress}/>
        <Button
          title={'Set to this wallet'}
          onPress={ev => this.setRewardAddressToThisWallet()}/>
        <Button
          title={'Custom address'}
          onPress={ev => this.setState({rewardAddress: ""})}/>

        <View style={styles.horizontalLayout}>
          <View style={styles.button}>
            <Button
              title={'Cancel'}
              onPress={this.props.onClose}/>
          </View>
          <View style={styles.button}>
            <Button
              title={'Confirm'}
              onPress={() => this.onConfirm()}/>
          </View>
        </View>


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
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
    text: {
      fontSize: 16,
      fontWeight: '700',
      marginEnd: 20,
    },
    button: {
      flex: 1,
      marginHorizontal: 20,
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      paddingHorizontal: 8,
    },
    horizontalLayout: {
      flexDirection: 'row',
    },
  }
)

export default Validate
