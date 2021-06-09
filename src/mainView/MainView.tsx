import React, {Component} from "react"
import {Alert, Appearance, Button, Modal, ScrollView, SectionList, StyleSheet, Text} from "react-native"
import {Colors} from "react-native/Libraries/NewAppScreen"
import CommonViewModel from "../CommonViewModel"
import Header from "./Header"
import MainViewViewModel from "./MainViewViewModel"
import SendAvaxX from "../sendAvax/SendAvaxX"
import {MnemonicWallet} from "../../wallet_sdk"
import SendAvaxC from "../sendAvax/SendAvaxC"
import SendCrossChain from "../sendAvax/SendCrossChain";
import Loader from "../common/Loader"
import Validate from "../earn/Validate"

type MainViewProps = {
  wallet: MnemonicWallet,
  onLogout: () => void,
}
type MainViewState = {
  isDarkMode: boolean
  backgroundStyle: any
  loaderVisible: boolean
  avaxPrice: number
  addressX: string
  addressP: string
  addressC: string
  availableX: string
  availableP: string
  availableC: string
  sendXVisible: boolean
  sendCVisible: boolean
  crossChainVisible: boolean
  validateVisible: boolean
  walletCAddress: string
  walletEvmAddress: string
}

class MainView extends Component<MainViewProps, MainViewState> {
  viewModel!: MainViewViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: MainViewProps | Readonly<MainViewProps>) {
    super(props)
    this.state = {
      isDarkMode: false,
      backgroundStyle: {},
      loaderVisible: true,
      avaxPrice: 0,
      addressX: "",
      addressP: "",
      addressC: "",
      availableX: "",
      availableP: "",
      availableC: "",
      sendXVisible: false,
      sendCVisible: false,
      crossChainVisible: false,
      validateVisible: false,
      walletCAddress: "",
      walletEvmAddress: "",
    }
    this.viewModel = new MainViewViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.viewModel.onComponentMount()

    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })
    this.viewModel.avaxPrice.subscribe(value => {
      this.setState({avaxPrice: value})
    })
    this.viewModel.walletCAddress.subscribe(value => {
      this.setState({walletCAddress: value})
    })
    this.viewModel.walletEvmAddrBech.subscribe(value => {
      this.setState({walletEvmAddress: value})
    })
    this.viewModel.addressX.subscribe(value => {
      this.setState({addressX: value})
    })
    this.viewModel.addressP.subscribe(value => {
      this.setState({addressP: value})
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

    this.viewModel.onResetHdIndices()
      .subscribe({
        next: value => console.log(value),
        error: err => {
          this.onLogout()
          Alert.alert("Error", err.message)
        },
        complete: () => this.setState({loaderVisible: false}),
      })
  }

  componentWillUnmount(): void {
  }

  private onSendX(addressX: string, amount: string): void {
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

  private onSendC(addressC: string, amount: string): void {
    this.viewModel.onSendAvaxC(addressC, amount)
      .subscribe({
        next: txHash => {
          Alert.alert("Success", "Created transaction: " + txHash)
        },
        error: err => Alert.alert("Error", err.message),
        complete: () => {
        },
      })
  }

  private onLogout(): void {
    this.props.onLogout()
  }

  render(): Element {
    const sectionListData = [
      {
        title: "Avax Price",
        data: ["$" + this.state.avaxPrice],
      },
      {
        title: "Derived Wallet Address",
        data: [this.state.addressX],
      },
      {
        title: "Derived Platform Wallet Address",
        data: [this.state.addressP],
      },
      {
        title: "Derived EVM Wallet Address",
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
      <ScrollView>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={"Loading wallet..."}/>
        </Modal>

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
        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.sendXVisible}
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
          <SendAvaxX
            onClose={() => {
              this.setState({
                sendXVisible: false,
              })
            }}
            onSend={(addressX, amount) => {
              this.onSendX(addressX, amount)
            }}
          />
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.sendCVisible}
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
          <SendAvaxC
            onClose={() => {
              this.setState({
                sendCVisible: false,
              })
            }}
            onSend={(addressX, amount) => {
              this.onSendC(addressX, amount)
            }}/>
        </Modal>
        <Button
          title={"Send AVAX X"}
          onPress={() => {
            this.setState({
              sendXVisible: true,
            })
          }}
        />
        <Button
          title={"Send AVAX C"}
          onPress={() => {
            this.setState({
              sendCVisible: true,
            })
          }}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.crossChainVisible}
          onRequestClose={() => {
            console.warn("Modal has been closed.")
          }}>
          <SendCrossChain
            wallet={this.viewModel.wallet.value}
            onClose={() => {
              this.setState({
                crossChainVisible: false,
              })
            }}/>
        </Modal>
        <Button
          title={"Cross chain"}
          onPress={() => this.setState({crossChainVisible: true})}/>

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.validateVisible}>
          <Validate
            wallet={this.viewModel.wallet.value}
            onClose={() => this.setState({validateVisible: false})}/>
        </Modal>
        <Button
          title={"Validate"}
          onPress={() => this.setState({validateVisible: true})}/>

        <Button
          title={"LogOut"}
          onPress={() => this.onLogout()}/>
      </ScrollView>
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

export default MainView
