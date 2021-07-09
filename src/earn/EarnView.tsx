import React, {Component} from "react"
import {Appearance, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import Header from "../mainView/Header"
import ButtonAva from "../common/ButtonAva"
import Validate from "./Validate"
import EarnViewModel from "./EarnViewModel"
import TextTitle from "../common/TextTitle"

type Props = {
  wallet: MnemonicWallet,
}
type State = {
  isDarkMode: boolean
  validateVisible: boolean
}

class EarnView extends Component<Props, State> {
  viewModel!: EarnViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      validateVisible: false,
    }
    this.viewModel = new EarnViewModel(this.props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  componentWillUnmount(): void {
  }

  render(): Element {

    return (
      <View style={styles.container}>
        <Header/>
        <TextTitle text={"Earn"}/>
        <View style={styles.buttons}>
          <ButtonAva text={"Validate"} onPress={() => this.setState({validateVisible: true})}/>
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          onRequestClose={() => this.setState({validateVisible: false})}
          visible={this.state.validateVisible}>
          <Validate
            wallet={this.viewModel.wallet.value}
            onClose={() => this.setState({validateVisible: false})}/>
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingBottom: 88,
  },
  buttons: {
    height: "100%",
    justifyContent: "flex-end",
  }
})

export default EarnView
