import React, {Component} from 'react'
import {Appearance, Image, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import TextLabel from "../common/TextLabel"
import BiometricsSDK from "../BiometricsSDK"
import {UserCredentials} from "react-native-keychain"
import {asyncScheduler, timer} from "rxjs"
import {concatMap} from "rxjs/operators"

type Props = {
  onCreateWallet: () => void,
  onAlreadyHaveWallet: () => void,
  onEnterWallet: (mnemonic: string) => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any
}

class Onboard extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())
  pkg = require('../../package.json')

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

    this.promptForWalletLoadingIfExists()
  }

  private promptForWalletLoadingIfExists() {
    timer(100, asyncScheduler).pipe(
      concatMap(value => BiometricsSDK.loadMnemonic(BiometricsSDK.loadOptions))
    ).subscribe({
      next: value => {
        if (value !== false) {
          const mnemonic = (value as UserCredentials).password
          this.props.onEnterWallet(mnemonic)
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
        <ButtonAva text={"Create wallet"} onPress={() => this.onCreateWallet()}/>
        <ButtonAva text={"I already have wallet"} onPress={() => this.onAlreadyHaveWallet()}/>
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
