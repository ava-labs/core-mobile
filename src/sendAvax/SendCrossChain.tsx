import React, {Component} from 'react'
import {
  Alert,
  Appearance,
  FlatList,
  ListRenderItem,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View
} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'
import SendCrossChainViewModel, {Chain, ChainRenderItem} from './SendCrossChainViewModel';
import Loader from "../common/Loader"
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import ButtonAva from "../common/ButtonAva"
import TextTitle from "../common/TextTitle"
import InputAmount from "../common/InputAmount"

type Props = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  loaderVisible: boolean,
  loaderMsg: string,
  backgroundStyle: any,
  sourceChain: Chain,
  destinationChain: Chain,
  balance: string,
  selectSourceChainVisible: boolean,
  selectDestinationChainVisible: boolean,
  sendAmount: string,
  availableDestinationChains: Chain[],
}

class SendCrossChain extends Component<Props, State> {
  viewModel!: SendCrossChainViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      balance: '',
      sourceChain: Chain.X,
      destinationChain: Chain.P,
      isDarkMode: false,
      loaderVisible: false,
      loaderMsg: '',
      selectSourceChainVisible: false,
      selectDestinationChainVisible: false,
      availableDestinationChains: [],
      sendAmount: '0.00',
      backgroundStyle: {}
    }
    this.viewModel = new SendCrossChainViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.balance.subscribe(value => this.setState({balance: value}))
    this.viewModel.availableDestinationChains.subscribe(value => this.setState({availableDestinationChains: value}))
    this.viewModel.sourceChain.subscribe(value => this.setState({
      sourceChain: value,
      selectSourceChainVisible: false
    }))
    this.viewModel.destinationChain.subscribe(value => this.setState({
      destinationChain: value,
      selectDestinationChainVisible: false
    }))
    this.viewModel.loaderMsg.subscribe(value => this.setState({loaderMsg: value}))
    this.viewModel.loaderVisible.subscribe(value => this.setState({loaderVisible: value}))
  }

  componentWillUnmount(): void {
  }

  onSend(): void {
    this.viewModel.makeTransfer(this.state.sourceChain, this.state.destinationChain, this.state.sendAmount)
      .subscribe({
        error: err => console.error(err.message),
        complete: () => Alert.alert("Finished")
      })
  }

  render(): Element {

    const sourceChainRenderItem: ListRenderItem<ChainRenderItem> = (info: ListRenderItemInfo<ChainRenderItem>) => {
      return <Pressable onPress={() => this.viewModel.setSourceChain(info.item.chain)} style={styles.pressable}>
        <TextTitle text={info.item.displayString} size={14}/>
      </Pressable>
    }
    const destinationChainRenderItem: ListRenderItem<ChainRenderItem> = (info: ListRenderItemInfo<ChainRenderItem>) => {
      return <Pressable onPress={() => this.viewModel.setDestinationChain(info.item.chain)} style={styles.pressable}>
        <TextTitle text={info.item.displayString} size={14}/>
      </Pressable>
    }

    return (
      <SafeAreaView style={[this.state.backgroundStyle, styles.bg]}>

        <TextTitle text={"Send Cross Chain"}/>
        <View style={styles.horizontalLayout}>
          <TextTitle text={"Source chain:"} size={18}/>
          <ButtonAva text={this.viewModel.getChainString(this.state.sourceChain)} onPress={() => {
            this.setState({
              selectSourceChainVisible: true,
            })
          }}/>
        </View>
        <View style={styles.horizontalLayout}>
          <TextTitle text={"Destination chain:"} size={18}/>
          <ButtonAva text={this.viewModel.getChainString(this.state.destinationChain)} onPress={() => {
            this.setState({
              selectDestinationChainVisible: true,
            })
          }}/>
        </View>
        <TextTitle text={"Transfer amount:"} size={18}/>
        <InputAmount
          onChangeText={text => this.setState({sendAmount: text})}
          value={this.state.sendAmount}/>
        <View style={[styles.horizontalLayout, styles.horizBalance]}>
          <TextTitle text={"Balance: "} size={18}/>
          <TextTitle text={this.state.balance} size={18} bold={true}/>
        </View>
        <View style={[styles.horizontalLayout, styles.horizButtons]}>
          <ButtonAva
            text={'Cancel'}
            onPress={this.props.onClose}/>
          <ButtonAva
            text={'Send'}
            onPress={() => this.onSend()}/>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={this.state.loaderMsg}/>
        </Modal>

        <Modal animationType={'fade'} transparent={true} visible={this.state.selectSourceChainVisible}>
          <View style={styles.modalContainer}>
            <View
              style={[styles.modalBackground, {backgroundColor: this.state.isDarkMode ? Colors.black : Colors.white}]}>
              <FlatList
                style={{height: 100}}
                data={this.viewModel.getChainRenderItems(this.viewModel.availableSourceChains)}
                renderItem={sourceChainRenderItem}
                keyExtractor={item => item.chain.toString()}
              />
            </View>
          </View>
        </Modal>

        <Modal animationType={'fade'} transparent={true} visible={this.state.selectDestinationChainVisible}>
          <View style={styles.modalContainer}>
            <View
              style={[styles.modalBackground, {backgroundColor: this.state.isDarkMode ? Colors.black : Colors.white}]}>
              <FlatList
                style={{height: 100}}
                data={this.viewModel.getChainRenderItems(this.state.availableDestinationChains)}
                renderItem={destinationChainRenderItem}
                keyExtractor={item => item.chain.toString()}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({
    modalContainer: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBackground: {
      flexDirection: 'row',
      padding: 30,
      margin: 30,
      borderRadius: 18,
    },
    horizontalLayout: {
      flexDirection: 'row',
      justifyContent: "space-between",
      alignItems: "center"
    },
    horizButtons: {
      justifyContent: "space-evenly",
    },
    horizBalance: {
      justifyContent: "flex-start",
    },
    pressable: {
      margin: 4,
      padding: 4,
    },
  }
)

export default SendCrossChain
