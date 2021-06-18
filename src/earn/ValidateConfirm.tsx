import React, {Component} from 'react'
import {Appearance, SafeAreaView, ScrollView, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import TextTitle from "../common/TextTitle"
import InputText from "../common/InputText"
import InputAmount from "../common/InputAmount"
import ButtonAva from "../common/ButtonAva"

type Props = {
  nodeId: string,
  stakingAmount: string,
  endDate: string,
  delegationFee: string,
  rewardAddress: string,
  onSubmit: () => void,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class ValidateConfirm extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: Props | Readonly<Props>) {
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
        <ScrollView>

          <TextTitle text={"Check data and confirm"}/>
          <TextTitle text={"Node ID:"} size={18}/>
          <InputText editable={false} value={this.props.nodeId}/>

          <TextTitle text={"Staking amount:"} size={18}/>
          <InputAmount editable={false} initValue={this.props.stakingAmount}/>

          <TextTitle text={"Start date:"} size={18}/>
          <InputText editable={false}
                     value={"Your validation will start at least 5 minutes after you submit this form."}/>

          <TextTitle text={"End date:"} size={18}/>
          <InputText editable={false} value={this.props.endDate}/>

          <TextTitle text={"Delegation fee:"} size={18}/>
          <InputAmount editable={false} initValue={this.props.delegationFee}/>

          <TextTitle text={"Reward address:"} size={18}/>
          <InputText editable={false} value={this.props.rewardAddress}/>

          <View style={styles.horizontalLayout}>
            <ButtonAva
              text={'Cancel'}
              onPress={this.props.onClose}/>
            <ButtonAva
              text={'Confirm'}
              onPress={this.props.onSubmit}/>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
    horizontalLayout: {
      flexDirection: 'row',
      justifyContent: "space-evenly"
    },
  }
)

export default ValidateConfirm
