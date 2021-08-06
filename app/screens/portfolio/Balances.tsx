import React from 'react';
import {StyleSheet, View} from 'react-native';
import TextLabel from 'components/TextLabel';
import TextAmount from 'components/TextAmount';
import {BehaviorSubject} from 'rxjs';
import {useBalances} from './UseBalances';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';

type Props = {
  wallet: BehaviorSubject<MnemonicWallet>;
};

export default function Balances(props: Props | Readonly<Props>) {
  const [
    availableX,
    availableP,
    lockedX,
    lockedP,
    lockedStakeable,
    availableC,
    stakingAmount,
    availableTotal,
  ] = useBalances(props.wallet.value);

  return (
    <View>
      <TextAmount text={availableTotal} size={36} textAlign={'center'} />
      <View style={styles.horizontalLayout}>
        <View style={styles.column}>
          <TextLabel text={'Available (X)'} />
          <TextAmount text={availableX} />
          <TextLabel text={'Available (P)'} />
          <TextAmount text={availableP} />
          <TextLabel text={'Available (C)'} />
          <TextAmount text={availableC} />
        </View>
        <View style={styles.column}>
          <TextLabel text={'Locked (X)'} />
          <TextAmount text={lockedX} />
          <TextLabel text={'Locked (P)'} />
          <TextAmount text={lockedP} />
          <TextLabel text={'Locked Stakeable'} />
          <TextAmount text={lockedStakeable} />
        </View>
        <View style={styles.column}>
          <TextLabel text={'Staking'} />
          <TextAmount text={stakingAmount} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
    padding: 8,
  },
  column: {
    flex: 1,
  },
});
