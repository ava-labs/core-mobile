import React, {Component} from 'react'
import {Appearance, FlatList, Modal, SafeAreaView, StyleSheet} from 'react-native'
import CommonViewModel from '../CommonViewModel'
import {MnemonicWallet} from "@avalabs/avalanche-wallet-sdk"
import TextTitle from "../common/TextTitle"
import TransactionsViewModel, {HistoryItem} from "./TransactionsViewModel"
import TransactionItem from "./TransactionItem"
import Loader from "../common/Loader"
import Header from "../mainView/Header"

type Props = {
  wallet: MnemonicWallet,
  onClose: () => void,
}
type State = {
  isDarkMode: boolean,
  loaderVisible: boolean,
  loaderMsg: string,
  backgroundStyle: any,
  historyItems: HistoryItem[],
}

class Transactions extends Component<Props, State> {
  viewModel!: TransactionsViewModel
  commonViewModel: CommonViewModel = new CommonViewModel(Appearance.getColorScheme())

  constructor(props: Props | Readonly<Props>) {
    super(props)
    this.state = {
      isDarkMode: false,
      loaderVisible: false,
      loaderMsg: '',
      backgroundStyle: {},
      historyItems: [],
    }
    this.viewModel = new TransactionsViewModel(props.wallet)
  }

  componentDidMount(): void {
    this.commonViewModel.isDarkMode.subscribe(value => this.setState({isDarkMode: value}))
    this.commonViewModel.backgroundStyle.subscribe(value => this.setState({backgroundStyle: value}))
    this.viewModel.history.subscribe((value: HistoryItem[]) => this.setState({historyItems: value}))
    this.viewModel.loaderVisible.subscribe(value => this.setState({loaderVisible: value}))
    this.viewModel.loaderMsg.subscribe(value => this.setState({loaderMsg: value}))
  }

  componentWillUnmount(): void {
  }


  render(): Element {

    const renderItem = (item: HistoryItem) => (
      <TransactionItem type={item.type} date={item.date} info={item.info} amount={item.amount}
                       address={item.address} explorerUrl={item.explorerUrl}/>
    )

    return (
      <SafeAreaView style={this.state.backgroundStyle}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.loaderVisible}>
          <Loader message={this.state.loaderMsg}/>
        </Modal>

        <Header showBack onBack={this.props.onClose}/>
        <TextTitle text={"Transactions"}/>
        <FlatList
          data={this.state.historyItems}
          renderItem={info => renderItem(info.item)}
          keyExtractor={item => item.id}
        />
      </SafeAreaView>
    )
  }
}

const styles: any = StyleSheet.create({}
)

export default Transactions
