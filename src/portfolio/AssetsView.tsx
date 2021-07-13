import React, {Component} from "react"
import {Appearance, FlatList, Modal, StyleSheet, View} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import Header from "../mainView/Header"
import TextTitle from "../common/TextTitle"
import {SceneMap, TabView} from "react-native-tab-view"
import AssetsViewModel, {TokenItem} from "./AssetsViewModel"
import AssetsItem from "./AssetsItem"
import {BehaviorSubject} from "rxjs"
import TabBarAva from "../common/TabBarAva"
import ButtonAva from "../common/ButtonAva"
import AssetsAddToken from "./AssetsAddToken"

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>,
}
type State = {
  isDarkMode: boolean
  index: number
  tokenItems: TokenItem[]
  addTokenVisible: boolean
}

class AssetsView extends Component<Props, State> {
  viewModel!: AssetsViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      addTokenVisible: false,
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

  private renderItem = (item: TokenItem) => (
    <AssetsItem title={item.title} balance={item.balance}/>
  )

  private tokensRoute = () => (
    <FlatList data={this.state.tokenItems}
              renderItem={info => this.renderItem(info.item)}
              keyExtractor={item => item.id}/>
  )

  private collectiblesRoute = () => (
    <TextTitle text={"Collectibles"}/>
  )

  private renderScene = SceneMap({
    Tokens: this.tokensRoute,
    Collectibles: this.collectiblesRoute,
  })

  private routes = [
    {key: 'Tokens', title: 'Tokens'},
    {key: 'Collectibles', title: 'Collectibles'},
  ]

  render(): Element {

    return (
      <View style={styles.container}>
        <Header/>
        <TabView
          navigationState={{
            index: this.state.index,
            routes: this.routes
          }}
          renderScene={this.renderScene}
          renderTabBar={TabBarAva}
          onIndexChange={index => this.setState({index: index})}
        />
        <ButtonAva text={"Add token"} onPress={() => this.setState({addTokenVisible: true})}/>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.addTokenVisible}
          onRequestClose={() => this.setState({addTokenVisible: false})}>
          <AssetsAddToken
            wallet={this.viewModel.wallet}
            onClose={() => {
              this.setState({
                addTokenVisible: false,
              })
            }}/>
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
  },
})

export default AssetsView
