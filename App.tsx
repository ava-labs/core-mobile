/**
 * Avalanche Wallet App
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from "react"
import {
  Alert,
  Appearance,
  Button,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
} from "react-native"
import Header from "./src/mainView/Header"
import AppViewModel from "./src/AppViewModel"
import Clock from "./src/mainView/Clock"
import {Colors} from "react-native/Libraries/NewAppScreen"
import SendAvaxModal from "./src/mainView/SendAvaxModal"
import CommonViewModel from "./src/CommonViewModel"

type AppProps = {}
type AppState = {
  avaxPrice: number
  backgroundStyle: any
  mnemonic: string
  walletCAddress: string
  walletEvmAddress: string
  isDarkMode: boolean
  externalAddressX: string
  externalAddressP: string
  addressC: string
  availableX: string
  availableP: string
  availableC: string
  sendAvaxVisible: boolean
}

class App extends Component<AppProps, AppState> {
  viewModel: AppViewModel = new AppViewModel()
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: AppProps | Readonly<AppProps>) {
    super(props)
    this.state = {
      avaxPrice: 0,
      backgroundStyle: {},
      mnemonic: "",
      walletCAddress: "",
      walletEvmAddress: "",
      isDarkMode: false,
      externalAddressX: "",
      externalAddressP: "",
      addressC: "",
      availableX: "",
      availableP: "",
      availableC: "",
      sendAvaxVisible: false,
    }
  }

  componentWillUnmount() {
    console.log("componentWillUnmount")
  }

  componentDidMount() {
    console.log("componentDidMount")

    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })

    this.viewModel.onComponentMount()
    this.viewModel.avaxPrice.subscribe(value => {
      this.setState({avaxPrice: value})
    })
    this.setState({mnemonic: this.viewModel.mnemonic})
    this.viewModel.walletCAddress.subscribe(value => {
      this.setState({walletCAddress: value})
    })
    this.viewModel.walletEvmAddrBech.subscribe(value => {
      this.setState({walletEvmAddress: value})
    })
    this.viewModel.externalAddressesX.subscribe(value => {
      if (value.length != 0) {
        this.setState({externalAddressX: value[0]})
      }
    })
    this.viewModel.externalAddressesP.subscribe(value => {
      if (value.length != 0) {
        this.setState({externalAddressP: value[0]})
      }
    })
    this.viewModel.addressC.subscribe(value => {
      this.setState({addressC: value})
    })
    this.viewModel.availableX.subscribe(value => {
      this.setState({availableX: value})
    })
    this.viewModel.availableP.subscribe(value => {
      this.setState({availableP: value})
    })
    this.viewModel.availableC.subscribe(value => {
      this.setState({availableC: value})
    })
  }

  private onResetHdIndices(): void {
    this.viewModel.onResetHdIndices()
      .subscribe({
        next: value => console.log(value),
        error: err => console.error(err),
        complete: () => {
        },
      })
  }

  private onSend(addressX: string, amount: string): void {
    this.viewModel.onSendAvaxX(addressX, amount)
      .subscribe({
        next: txHash => {
          Alert.alert("Success", "Created transaction: " + txHash)
        },
        error: err => Alert.alert("Error", err.message),
        complete: () => {
        },
      })
  }

  render() {
    console.log("render")
    const sectionListData = [
      {
        title: "Avax Price",
        data: ["$" + this.state.avaxPrice],
      },
      {
        title: "Mnemonic",
        data: [this.state.mnemonic],
      },
      {
        title: "External addresses X",
        data: [this.state.externalAddressX],
      },
      {
        title: "External addresses P",
        data: [this.state.externalAddressP],
      },
      {
        title: "External addresses C",
        data: [this.state.addressC],
      },
      {
        title: "Available (X)",
        data: [this.state.availableX],
      },
      {
        title: "Available (P)",
        data: [this.state.availableP],
      },
      {
        title: "Available (C)",
        data: [this.state.availableC],
      },
    ]
    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <StatusBar
          barStyle={this.state.isDarkMode ? "light-content" : "dark-content"}
        />
        <Clock/>
        <Header/>
        <SectionList
          sections={sectionListData}
          renderItem={({item}) => (
            <Text
              style={[
                styles.item,
                {color: this.state.isDarkMode ? Colors.light : Colors.dark},
              ]}>
              {item}
            </Text>
          )}
          renderSectionHeader={({section}) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        <Button
          title={"Reset Hd indices"}
          onPress={() => this.onResetHdIndices()}
        />
        <SendAvaxModal
          visible={this.state.sendAvaxVisible}
          onClose={() => {
            this.setState({
              sendAvaxVisible: false,
            })
          }}
          onSend={(addressX, amount) => {
            this.onSend(addressX, amount)
          }}
        />
        <Button
          title={"Send AVAX X"}
          onPress={() => {
            this.setState({
              sendAvaxVisible: true,
            })
          }}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 22,
  },
  sectionHeader: {
    paddingTop: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 2,
    fontSize: 14,
    fontWeight: "bold",
    backgroundColor: "rgba(247,247,247,1.0)",
  },
  item: {
    padding: 10,
    fontSize: 18,
    height: 44,
  },
})
export default App
