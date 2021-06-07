import React, {Component} from 'react'
import {
  Appearance,
  Button,
  FlatList,
  ListRenderItem,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import {Colors} from 'react-native/Libraries/NewAppScreen'
import CommonViewModel from '../CommonViewModel'
import SendCrossChainViewModel, {Chain, ChainRenderItem} from './SendCrossChainViewModel';
import {MnemonicWallet} from '../../wallet_sdk';

type SendCrossChainProps = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type SendCrossChainState = {
  isDarkMode: boolean,
  backgroundStyle: any,
  sourceChain: Chain,
  destinationChain: Chain,
  transferAmount: string,
  balance: string,
  selectSourceChainVisible: boolean,
  selectSDestinationChainVisible: boolean,
  sendAmount: string,
  availableDestinationChains: Chain[],
}

class SendCrossChain extends Component<SendCrossChainProps, SendCrossChainState> {
  viewModel!: SendCrossChainViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme() as string)

  constructor(props: SendCrossChainProps | Readonly<SendCrossChainProps>) {
    super(props)
    this.state = {
      balance: '',
      sourceChain: Chain.X,
      destinationChain: Chain.P,
      transferAmount: '',
      isDarkMode: false,
      selectSourceChainVisible: false,
      selectSDestinationChainVisible: false,
      availableDestinationChains: [],
      sendAmount: '0.00',
      backgroundStyle: {}
    }
    this.viewModel = new SendCrossChainViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => {
      this.setState({isDarkMode: value})
    })
    this.commonViewModel.backgroundStyle.subscribe(value => {
      this.setState({backgroundStyle: value})
    })

    this.viewModel.balance.subscribe(value => {
      this.setState({balance: value})
    })
    this.viewModel.availableDestinationChains.subscribe(value => {
      this.setState({
        availableDestinationChains: value
      })
    })
    this.viewModel.sourceChain.subscribe(value => {
      this.setState({
        sourceChain: value,
        selectSourceChainVisible: false
      })
    })
    this.viewModel.destinationChain.subscribe(value => {
      this.setState({
        destinationChain: value,
        selectSDestinationChainVisible: false
      })
    })
  }

  componentWillUnmount(): void {
  }

  render(): Element {

    const sourceChainRenderItem: ListRenderItem<ChainRenderItem> = (info: ListRenderItemInfo<ChainRenderItem>) => {
      return <Pressable onPress={() => this.viewModel.setSourceChain(info.item.chain)} style={styles.pressable}>
        <Text>{info.item.displayString}</Text>
      </Pressable>
    }
    const destinationChainRenderItem: ListRenderItem<ChainRenderItem> = (info: ListRenderItemInfo<ChainRenderItem>) => {
      return <Pressable onPress={() => this.viewModel.setDestinationChain(info.item.chain)} style={styles.pressable}>
        <Text>{info.item.displayString}</Text>
      </Pressable>
    }

    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Send Cross Chain
        </Text>
        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Source chain:
        </Text>
        <Button title={this.viewModel.getChainString(this.state.sourceChain)} onPress={() => {
          this.setState({
            selectSourceChainVisible: true,
          })
        }}/>
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


        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Destination chain:
        </Text>
        <Button title={this.viewModel.getChainString(this.state.destinationChain)} onPress={() => {
          this.setState({
            selectSDestinationChainVisible: true,
          })
        }}/>
        <Modal animationType={'fade'} transparent={true} visible={this.state.selectSDestinationChainVisible}>
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

        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Transfer amount:
        </Text>
        <TextInput
          style={styles.input}
          onChangeText={text => {
            this.setState({
              sendAmount: text
            })
          }}
          value={this.state.sendAmount}/>


        <Text style={[styles.text, {color: this.state.isDarkMode ? Colors.white : Colors.black},]}>
          Balance: {this.state.balance}
        </Text>

        <View style={styles.horizontalLayout}>
          <View style={styles.button}>
            <Button
              title={'Cancel'}
              onPress={this.props.onClose}/>
          </View>
          <View style={styles.button}>
            <Button
              title={'Send'}
              onPress={() => {
                // this.props.onSend(this.state.addressXToSendTo, this.state.sendAmount)
              }}/>
          </View>
        </View>
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
    text: {
      fontSize: 16,
      fontWeight: '700',
      marginEnd: 20,
    },
    button: {
      flex: 1,
      marginHorizontal: 20,
    },
    buttonClose: {
      backgroundColor: '#2196F3',
    },
    input: {
      height: 40,
      margin: 12,
      borderWidth: 1,
      paddingHorizontal: 8,
    },
    horizontalLayout: {
      flexDirection: 'row',
    },
    pressable: {
      margin: 4,
      padding: 4,
    },
  }
)

export default SendCrossChain
