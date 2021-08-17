import React, {FC, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import PortfolioViewModel from './PortfolioViewModel';
import Header from 'screens/mainView/Header';
import Balances from './Balances';
import TabbedAddressCards from './TabbedAddressCards';
import {BehaviorSubject, Subscription} from 'rxjs';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import TextLabel from 'components/TextLabel';

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>;
  onExit: () => void;
  onSwitchWallet: () => void;
};

const PortfolioView: FC<Props> = ({wallet, onExit, onSwitchWallet}) => {
  const [viewModel] = useState(new PortfolioViewModel(wallet));
  const [avaxPrice, setAvaxPrice] = useState(0);
  const [addressX, setAddressX] = useState('');
  const [addressP, setAddressP] = useState('');
  const [addressC, setAddressC] = useState('');

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      viewModel.avaxPrice.subscribe(value => setAvaxPrice(value)),
    );
    disposables.add(viewModel.addressX.subscribe(value => setAddressX(value)));
    disposables.add(viewModel.addressP.subscribe(value => setAddressP(value)));
    disposables.add(viewModel.addressC.subscribe(value => setAddressC(value)));
    viewModel.onComponentMount();

    return () => {
      disposables.unsubscribe();
      viewModel.onComponentUnMount();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Header
        showExit
        onExit={onExit}
        showSwitchWallet
        onSwitchWallet={onSwitchWallet}
      />
      <Balances wallet={wallet} />
      <TextLabel text={'Avax price = ' + avaxPrice + 'USD'} />
      <TabbedAddressCards
        addressP={addressP}
        addressX={addressX}
        addressC={addressC}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
});

export default PortfolioView;
