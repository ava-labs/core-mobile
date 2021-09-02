import React, {useEffect, useState} from 'react';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import TransactionsViewModel, {
  HistoryItem,
} from 'screens/transactions/TransactionsViewModel';
import {FlatList, Modal, StyleSheet, View} from 'react-native';
import Loader from 'components/Loader';
import TextTitle from 'components/TextTitle';
import TransactionItem from './TransactionItem';
import Header from 'screens/mainView/Header';

type Props = {
  wallet: MnemonicWallet;
};

export default function TransactionsView(props: Props | Readonly<Props>) {
  const [viewModel] = useState(new TransactionsViewModel(props.wallet));
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    viewModel.history.subscribe(value => setHistoryItems(value));
    viewModel.loaderVisible.subscribe(value => setLoaderVisible(value));
    viewModel.loaderMsg.subscribe(value => setLoaderMsg(value));
  }, []);

  const renderItem = (item: HistoryItem) => (
    <TransactionItem
      type={item.type}
      date={item.date}
      info={item.info}
      amount={item.amount}
      address={item.address}
      explorerUrl={item.explorerUrl}
    />
  );

  return (
    <View style={styles.container}>
      <Modal animationType="fade" transparent={true} visible={loaderVisible}>
        <Loader message={loaderMsg} />
      </Modal>

      <Header />
      <TextTitle text={'Transactions'} />
      <FlatList
        data={historyItems}
        renderItem={info => renderItem(info.item)}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});
