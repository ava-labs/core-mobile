import React, {Component} from "react"
import {Appearance} from "react-native"
import CommonViewModel from "../CommonViewModel"
import {SceneMap, TabBar, TabView} from "react-native-tab-view"
import AddressCard from "../common/AddressCard"
import {COLORS, COLORS_NIGHT} from "../common/Constants"

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
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

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


  render(): Element {
    const THEME = this.state.isDarkMode ? COLORS_NIGHT : COLORS

    const RouteX = () => (
      <AddressCard title={"Derived Wallet Address"} address={this.props.addressX}/>
    );
    const RouteP = () => (
      <AddressCard title={"Derived Platform Wallet Address"} address={this.props.addressP}/>
    );
    const RouteC = () => (
      <AddressCard title={"Derived EVM Wallet Address"} address={this.props.addressC}/>
    );

    const renderScene = SceneMap({
      X: RouteX,
      P: RouteP,
      C: RouteC,
    });

    const routes = [
      {key: 'X', title: 'X'},
      {key: 'P', title: 'P'},
      {key: 'C', title: 'C'},
    ]
    const renderTabBar = props => (
      <TabBar
        {...props}
        indicatorStyle={{backgroundColor: THEME.onPrimary}}
        style={{backgroundColor: THEME.primaryColor}}
        labelStyle={{color: THEME.onPrimary}}
        activeColor={THEME.onPrimary}
        inactiveColor={THEME.primaryColorLight}
      />
    )

    return (
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
    )
  }
}

export default TabbedAddressCards
