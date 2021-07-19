import React, {Component} from 'react'
import {Appearance, Image, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import TextLabel from "../common/TextLabel"
import OnboardViewModel, {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  WalletLoadingResults
} from "./OnboardViewModel"

type Props = {
  onCreateWallet: () => void,
  onAlreadyHaveWallet: () => void,
  onEnterWallet: (mnemonic: string) => void,
  onEnterSingletonWallet: (privateKey: string) => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
  showButtons: boolean
}

class Onboard extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  viewModel: OnboardViewModel = new OnboardViewModel()
  pkg = require('../../package.json')

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      showButtons: false,
      backgroundStyle: {},
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.showButtons.subscribe(value => this.setState({showButtons: value}))

    this.viewModel.promptForWalletLoadingIfExists().subscribe({
      next: (value: WalletLoadingResults) => {
        if (value instanceof MnemonicLoaded) {
          this.props.onEnterWallet(value.mnemonic)
        } else if (value instanceof PrivateKeyLoaded) {
          this.props.onEnterSingletonWallet(value.privateKey)
        }else if (value instanceof NothingToLoad) {
          //do nothing
        }
      },
      error: err => console.log(err.message)
    })
  }


  componentWillUnmount(): void {
  }

  onCreateWallet(): void {
    this.props.onCreateWallet()
  }

  onAlreadyHaveWallet(): void {
    this.props.onAlreadyHaveWallet()
  }

  render(): Element {
    return (
      <View style={styles.verticalLayout}>
        <View style={styles.logoContainer}>
          <Image
            accessibilityRole="image"
            source={require('../assets/AvaLogo.png')}
            style={styles.logo}/>
          <TextTitle text={"Avalanche Wallet"} textAlign={"center"} bold={true}/>
        </View>
        {this.state.showButtons && <ButtonAva text={"Create wallet"} onPress={() => this.onCreateWallet()}/>}
        {this.state.showButtons &&
        <ButtonAva text={"I already have wallet"} onPress={() => this.onAlreadyHaveWallet()}/>}
        <TextLabel text={"v" + this.pkg.version}/>
      </View>
    )
  }
}

const styles = StyleSheet.create({
    verticalLayout: {
      height: "100%",
      justifyContent: "flex-end",
    },
    logoContainer: {
      flexGrow: 1,
      justifyContent: "center"
    },
    logo: {
      marginTop: 0,
      height: 50,
      width: "100%",
      resizeMode: 'contain',
    },
  }
)
export default Onboard
