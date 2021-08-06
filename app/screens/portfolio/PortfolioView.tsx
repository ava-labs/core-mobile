import React, {FC, useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import PortfolioViewModel from './PortfolioViewModel';
import Header from 'screens/mainView/Header';
import Balances from './Balances';
import TabbedAddressCards from './TabbedAddressCards';
import {BehaviorSubject, Subscription} from 'rxjs';
import {MnemonicWallet, NetworkConstants} from '@avalabs/avalanche-wallet-sdk';
import {useAddresses} from '@avalabs/wallet-react-components/src/hooks/useAddresses';
import TextLabel from 'components/TextLabel';

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>;
  onExit: () => void;
  onSwitchWallet: () => void;
};

const PortfolioView: FC<Props> = ({wallet, onExit, onSwitchWallet}) => {
  const [viewModel] = useState(new PortfolioViewModel(wallet));
  const [avaxPrice, setAvaxPrice] = useState(0);
  const {addressX, addressP, addressC} = useAddresses(
    wallet?.value as MnemonicWallet,
    NetworkConstants.TestnetConfig,
  );

  useEffect(() => {
    const disposables = new Subscription();
    disposables.add(
      viewModel.avaxPrice.subscribe(value => setAvaxPrice(value)),
    );
    viewModel.onComponentMount();

    return () => {
      disposables.unsubscribe();
    };
  }, [viewModel]);

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
