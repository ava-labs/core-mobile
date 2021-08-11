import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  ListRenderItemInfo,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import SendCrossChainViewModel, {
  Chain,
  ChainRenderItem,
} from './SendCrossChainViewModel';
import Loader from 'components/Loader';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import InputAmount from 'components/InputAmount';
import {COLORS, COLORS_NIGHT} from 'resources/Constants';
import Header from 'screens/mainView/Header';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  wallet: MnemonicWallet;
  onClose: () => void;
};

export default function SendCrossChain(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new SendCrossChainViewModel(props.wallet));
  const [isDarkMode] = useState(context.isDarkMode);
  const [balance, setBalance] = useState('');
  const [sourceChain, setSourceChain] = useState(Chain.X);
  const [destinationChain, setDestinationChain] = useState(Chain.P);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMsg, setLoaderMsg] = useState('');
  const [selectSourceChainVisible, setSelectSourceChainVisible] =
    useState(false);
  const [selectDestinationChainVisible, setSelectDestinationChainVisible] =
    useState(false);
  const [availableDestinationChains, setAvailableDestinationChains] = useState(
    [] as Chain[],
  );
  const [sendAmount, setSendAmount] = useState('0.00');
  const [backgroundStyle] = useState(context.backgroundStyle);

  useEffect(() => {
    viewModel.balance.subscribe(value => setBalance(value));
    viewModel.availableDestinationChains.subscribe(value =>
      setAvailableDestinationChains(value),
    );
    viewModel.sourceChain.subscribe(value => {
      setSourceChain(value);
      setSelectSourceChainVisible(false);
    });
    viewModel.destinationChain.subscribe(value => {
      setDestinationChain(value);
      setSelectDestinationChainVisible(false);
    });
    viewModel.loaderMsg.subscribe(value => setLoaderMsg(value));
    viewModel.loaderVisible.subscribe(value => setLoaderVisible(value));
  }, []);

  const onSend = (): void => {
    viewModel
      .makeTransfer(sourceChain, destinationChain, sendAmount)
      .subscribe({
        error: err => console.error(err.message),
        complete: () => Alert.alert('Finished'),
      });
  };

  const THEME = isDarkMode ? COLORS_NIGHT : COLORS;
  const sourceChainRenderItem: ListRenderItem<ChainRenderItem> = (
    info: ListRenderItemInfo<ChainRenderItem>,
  ) => {
    return (
      <Pressable
        onPress={() => viewModel.setSourceChain(info.item.chain)}
        style={styles.pressable}>
        <TextTitle text={info.item.displayString} size={14} />
      </Pressable>
    );
  };
  const destinationChainRenderItem: ListRenderItem<ChainRenderItem> = (
    info: ListRenderItemInfo<ChainRenderItem>,
  ) => {
    return (
      <Pressable
        onPress={() => viewModel.setDestinationChain(info.item.chain)}
        style={styles.pressable}>
        <TextTitle text={info.item.displayString} size={14} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[backgroundStyle, styles.bg]}>
      <Header showBack onBack={props.onClose} />
      <TextTitle text={'Send Cross Chain'} />
      <View style={styles.horizontalLayout}>
        <TextTitle text={'Source chain:'} size={18} />
        <ButtonAva
          text={viewModel.getChainString(sourceChain)}
          onPress={() => {
            setSelectSourceChainVisible(true);
          }}
        />
      </View>
      <View style={styles.horizontalLayout}>
        <TextTitle text={'Destination chain:'} size={18} />
        <ButtonAva
          text={viewModel.getChainString(destinationChain)}
          onPress={() => {
            setSelectDestinationChainVisible(true);
          }}
        />
      </View>
      <TextTitle text={'Transfer amount:'} size={18} />
      <InputAmount
        showControls={true}
        onChangeText={text => setSendAmount(text)}
      />
      <View style={[styles.horizontalLayout, styles.horizBalance]}>
        <TextTitle text={'Balance: '} size={18} />
        <TextTitle text={balance} size={18} bold={true} />
      </View>

      <ButtonAva text={'Send'} onPress={() => onSend()} />

      <Modal animationType="fade" transparent={true} visible={loaderVisible}>
        <Loader message={loaderMsg} />
      </Modal>

      <Modal
        animationType={'fade'}
        transparent={true}
        visible={selectSourceChainVisible}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalBackground, {backgroundColor: THEME.bg}]}>
            <FlatList
              style={{height: 100}}
              data={viewModel.getChainRenderItems(
                viewModel.availableSourceChains,
              )}
              renderItem={sourceChainRenderItem}
              keyExtractor={item => item.chain.toString()}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType={'fade'}
        transparent={true}
        visible={selectDestinationChainVisible}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalBackground, {backgroundColor: THEME.bg}]}>
            <FlatList
              style={{height: 100}}
              data={viewModel.getChainRenderItems(availableDestinationChains)}
              renderItem={destinationChainRenderItem}
              keyExtractor={item => item.chain.toString()}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizButtons: {
    justifyContent: 'space-evenly',
  },
  horizBalance: {
    justifyContent: 'flex-start',
  },
  pressable: {
    margin: 4,
    padding: 4,
  },
});
