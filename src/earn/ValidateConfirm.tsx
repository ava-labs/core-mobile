import React, {Component} from 'react'
import {Appearance, Button, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'

type ValidateConfirmProps = {
  nodeId: string,
  stakingAmount: string,
  endDate: string,
  delegationFee: string,
  rewardAddress: string,
  onSubmit: () => void,
  onClose: () => void,
}
type ValidateConfirmState = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class ValidateConfirm extends Component<ValidateConfirmProps, ValidateConfirmState> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: ValidateConfirmProps | Readonly<ValidateConfirmProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
  }

  componentWillUnmount(): void {
  }

  render(): Element {

    return (
      <SafeAreaView style={this.state.backgroundStyle}>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Check data and confirm
        </Text>
        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Node ID:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={this.props.nodeId}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Staking amount:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={this.props.stakingAmount}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Start date:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={"Your validation will start at least 5 minutes after you submit this form."}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          End date:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={this.props.endDate}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Delegation fee:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={this.props.delegationFee}/>

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Reward address:
        </Text>
        <TextInput
          editable={false}
          style={styles.input}
          value={this.props.rewardAddress}/>

        <View style={styles.horizontalLayout}>
          <View style={styles.button}>
            <Button
              title={'Cancel'}
              onPress={this.props.onClose}/>
          </View>
          <View style={styles.button}>
            <Button
              title={'Confirm'}
              onPress={this.props.onSubmit}/>
          </View>
        </View>
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

export default ValidateConfirm
