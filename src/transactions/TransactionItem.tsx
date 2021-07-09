import React, {Component} from 'react'
import {Appearance, Linking, StyleSheet, View} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import TextTitle from "../common/TextTitle"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import TextLabel from "../common/TextLabel"
import TextAmount from "../common/TextAmount"
import moment from "moment"
import ImgButtonAva from "../common/ImgButtonAva"

type Props = {
  date: string
  info: string
  amount: string
  explorerUrl: string
  type?: "import" | "export"
  address?: string
}
type State = {
  isDarkMode: boolean,
  backgroundStyle: any,
}

class TransactionItem extends Component<Props, State> {
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

  private onExplorer = (url: string): void => {
    Linking.openURL(url).then(value => {
      console.log("Linking: " + value)
    })
  }


  render(): Element {
    let THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS
    const explorerIcon = this.state.isDarkMode ? require("../assets/icons/search_dark.png") : require("../assets/icons/search_light.png")
    const date = moment(this.props.date).format("MMM DD, YYYY")
    return (
      <View style={[{
        borderTopColor: THEME.primaryColorLight,
        borderTopWidth: 1
      }]}>
        <View style={styles.horizontalLayout}>
          <View style={[{
            flexShrink: 1,
          }]}>
            <TextTitle text={date} size={14}/>
            <TextLabel text={this.props.info}/>
            <TextAmount text={this.props.amount} type={this.props.type}/>
            {this.props.address ? <TextLabel text={this.props.address}/> : undefined}
          </View>
          <ImgButtonAva src={explorerIcon} onPress={() => this.onExplorer(this.props.explorerUrl)}/>
        </View>
      </View>
    )
  }
}

const styles: any = StyleSheet.create({
    horizontalLayout: {
      flexDirection: 'row',
      justifyContent: "space-between",
      alignItems: "center"
    },
  }
)

export default TransactionItem
