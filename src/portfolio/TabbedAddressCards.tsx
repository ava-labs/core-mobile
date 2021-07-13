import React, {Component} from "react"
import {Appearance} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {SceneMap, TabView} from "react-native-tab-view"
import AddressCard from "../common/AddressCard"
import TabBarAva from "../common/TabBarAva"

type Props = {
  addressX: string,
  addressC: string,
  addressP: string,
}
type State = {
  isDarkMode: boolean,
  index: number
}

class TabbedAddressCards extends Component<Props, State> {
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      index: 0,
    }
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
  }

  private xRoute = () => (
    <AddressCard title={"Derived Wallet Address"} address={this.props.addressX}/>
  )

  private pRoute = () => (
    <AddressCard title={"Derived Platform Wallet Address"} address={this.props.addressP}/>
  )

  private cRoute = () => (
    <AddressCard title={"Derived EVM Wallet Address"} address={this.props.addressC}/>
  )

  private renderScene = SceneMap({
    X: this.xRoute,
    P: this.pRoute,
    C: this.cRoute,
  })

  private routes = [
    {key: 'X', title: 'X'},
    {key: 'P', title: 'P'},
    {key: 'C', title: 'C'},
  ]

  render(): Element {
    return (
      <TabView
        navigationState={{
          index: this.state.index,
          routes: this.routes
        }}
        renderScene={this.renderScene}
        renderTabBar={TabBarAva}
        onIndexChange={index => this.setState({index: index})}
        style={[{height: 260}]}
      />
    )
  }
}

export default TabbedAddressCards
