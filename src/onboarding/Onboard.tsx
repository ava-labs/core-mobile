import React, {Component} from 'react'
import {Appearance, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import Header from '../mainView/Header'
import TextTitle from "../common/TextTitle"
import ButtonAva from "../common/ButtonAva"
import TextLabel from "../common/TextLabel"

type Props = {
  onCreateWallet: () => void,
  onAlreadyHaveWallet: () => void,
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any
}

class Onboard extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)
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
      <View>
        <Header/>
        <TextTitle text={"Welcome!"} textAlign={"center"} bold={true}/>

        <ButtonAva text={"Create wallet"} onPress={() => this.onCreateWallet()}/>
        <ButtonAva text={"I already have wallet"} onPress={() => this.onAlreadyHaveWallet()}/>
        <TextLabel text={"v" + this.pkg.version}/>
      </View>
    )
  }
}

export default Onboard
