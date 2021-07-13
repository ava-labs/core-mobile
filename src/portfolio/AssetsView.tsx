import React, {Component} from "react"
import {Appearance, FlatList, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import Header from "../mainView/Header"
import TextTitle from "../common/TextTitle"
import {SceneMap, TabBar, TabView} from "react-native-tab-view"
import AssetsViewModel, {TokenItem} from "./AssetsViewModel"
import {COLORS, COLORS_NIGHT} from "../common/Constants"
import AssetsItem from "./AssetsItem"
import {BehaviorSubject} from "rxjs"

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>,
}
type State = {
  isDarkMode: boolean
  index: number
  tokenItems: TokenItem[]
}

class AssetsView extends Component<Props, State> {
  viewModel!: AssetsViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      index: 0,
      tokenItems: []
    }
    this.viewModel = new AssetsViewModel(this.props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.viewModel.tokenItems.subscribe(value => this.setState({tokenItems: value}))
  }

  componentWillUnmount(): void {
  }


  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS

    const renderItem = (item: TokenItem) => (
      <AssetsItem title={item.title} balance={item.balance}/>
    )

    const Tokens = () => (
      <FlatList data={this.state.tokenItems}
                renderItem={info => renderItem(info.item)}
                keyExtractor={item => item.id}/>
    )
    const Collectibles = () => (
      <TextTitle text={"Collectibles"}/>
    )

    const renderScene = SceneMap({
      Tokens: Tokens,
      Collectibles: Collectibles,
    })

    const routes = [
      {key: 'Tokens', title: 'Tokens'},
      {key: 'Collectibles', title: 'Collectibles'},
    ]
    const renderTabBar = props => (
      <TabBar
        {...props}
        indicatorStyle={{backgroundColor: THEME.tabBarIndicator}}
        style={{backgroundColor: THEME.transparent}}
        labelStyle={{fontWeight: "bold"}}
        activeColor={THEME.tabBarText}
        inactiveColor={THEME.primaryColorLight}
      />
    )
    return (
      <View style={styles.container}>
        <Header/>
        <TabView
          navigationState={{
            index: this.state.index,
            routes: routes
          }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={index => this.setState({index: index})}
          style={[{height: 260}]}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingBottom: 88,
  },
})

export default AssetsView
