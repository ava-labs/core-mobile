import React, {useContext, useEffect, useState} from 'react';
import TransactionsViewModel, {
  HistoryItem,
} from 'screens/transactions/TransactionsViewModel';
import {FlatList, InteractionManager, View} from 'react-native';
import Loader from 'components/Loader';
import TransactionItem from 'screens/transactions/TransactionItem';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

export default function TransactionsView() {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(
    new TransactionsViewModel(useWalletContext()?.wallet as MnemonicWallet),
  );
  const [loaderVisible, setLoaderVisible] = useState<boolean>(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [backgroundStyle] = useState(context.backgroundStyle);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      viewModel.history.subscribe(value => setHistoryItems(value));
      viewModel.loaderVisible.subscribe(value => setLoaderVisible(value));
      viewModel.loaderMsg.subscribe(value => setLoaderMsg(value));
    });
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
    <View style={backgroundStyle}>
      {loaderVisible ? (
        <Loader message={loaderMsg} />
      ) : (
        <FlatList
          data={historyItems}
          renderItem={info => renderItem(info.item)}
          keyExtractor={item => item.id}
        />
      )}
    </View>
  );
}
