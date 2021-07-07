import React, {Component} from 'react'
import {Alert, Appearance, ScrollView, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import CheckMnemonicViewModel from "./CheckMnemonicViewModel"
import MnemonicInput from "./MnemonicInput"

type Props = {
  onSuccess: () => void,
  onBack: () => void,
  mnemonic: string,
}
export type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  enteredMnemonics: Map<number, string>
  enabledInputs: Map<number, boolean>
}

class CheckMnemonic extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  viewModel: CheckMnemonicViewModel = new CheckMnemonicViewModel(this.props.mnemonic)

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      enteredMnemonics: new Map(),
      enabledInputs: new Map(),
    }

  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.enteredMnemonic.subscribe(value => this.setState({enteredMnemonics: value}))
    this.viewModel.enabledInputs.subscribe(value => this.setState({enabledInputs: value}))
  }

  componentWillUnmount(): void {
    this.viewModel.cleanup()
  }

  private onBack = (): void => {
    this.props.onBack()
  }

  private onVerify = (): void => {
    this.viewModel.onVerify().subscribe({
      error: err => Alert.alert(err.message),
      complete: () => this.props.onSuccess(),
    })
  }

  private setMnemonic(index: number, value: string): void {
    this.viewModel.setMnemonic(index, value)
  }

  render(): Element {
    const mnemonics: Element[] = []
    this.state.enteredMnemonics.forEach((value, key) => {
      if (this.state.enabledInputs.get(key)) {
        mnemonics.push(
          <MnemonicInput key={key} keyNum={key} text={value} onChangeText={text => this.setMnemonic(key, text)}
                         editable={true}/>
        )
      } else {
        mnemonics.push(
          <MnemonicInput key={key} keyNum={key} text={value} editable={false}/>
        )
      }
    })


    return (
      <ScrollView>
        <Header showBack onBack={this.onBack}/>
        <TextTitle text={"Fill In Mnemonic Phrase Below"} size={20} textAlign={"center"}/>
        <View style={styles.mnemonics}>
          {mnemonics}
        </View>
        <ButtonAva text={"Verify"} onPress={this.onVerify}/>
      </ScrollView>
    )
  }
}

const styles: any = StyleSheet.create({
    mnemonics: {
      flexDirection: 'row',
      flexWrap: "wrap",
      justifyContent: "space-between"
    },
    horizontalLayout: {
      flexDirection: 'row',
      alignItems: "center",
      width: 120,
    },
  }
)
export default CheckMnemonic
