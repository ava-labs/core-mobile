import React, {Component} from 'react'
import {Appearance, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import TextTitle from "../common/TextTitle"
import {COLORS, COLORS_NIGHT} from "../common/Constants"

type Props = {
  title: string
  balance: string
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class AssetsItem extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

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
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    return (
      <View style={[styles.container, {
        borderBottomColor: THEME.bgLight,
        borderBottomWidth: 1
      }]}>
        <TextTitle text={this.props.title} size={18}/>
        <TextTitle text={this.props.balance} size={18}/>
      </View>
    )
  }
}

const styles: any = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: "space-between",
    padding: 8
  },
})

export default AssetsItem
