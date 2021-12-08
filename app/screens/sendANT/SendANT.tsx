import React from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {SendTokenNavigationProp} from 'screens/sendERC20/SendERC20Stack';
import {AntWithBalance, useSendAnt} from '@avalabs/wallet-react-components';
import SendForm from 'screens/send/SendForm';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import {bnAmountToString} from 'dto/SendInfo';
import {asyncScheduler, defer, from, scheduled} from 'rxjs';

export default function SendANT(): JSX.Element {
  const {selectedToken} = useSelectedTokenContext();
  const {
    sendFee,
    address,
    amount,
    canSubmit,
    error,
    submit,
    setAddress,
    setAmount,
  } = useSendAnt(selectedToken as AntWithBalance);
  const {navigate} = useNavigation<SendTokenNavigationProp>();

  async function handleOnConfirm(
    onSuccess: () => void,
    onError: (error: any) => void,
  ) {
    if (!address) {
      Alert.alert('Error', 'Address not set ');
      return;
    }
    if (!amount || amount.isZero()) {
      Alert.alert('Error', 'Amount not set ');
      return;
    }

    scheduled(
      defer(() => from(submit())),
      asyncScheduler,
    ).subscribe({
      next: (value: any) => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error');
        } else {
          console.log(value);
          navigate(AppNavigation.SendToken.DoneScreen);
          onSuccess();
        }
      },
      error: (err: any) => {
        onError(err);
      },
    });
  }

  return (
    <SendForm
      setAmount={setAmount}
      amount={amount}
      priceUSD={amount ? selectedToken?.priceUSD : 0}
      canSubmit={canSubmit}
      error={error}
      sendFee={sendFee}
      address={address}
      setAddress={setAddress}
      onNextPress={() => {
        navigate(AppNavigation.SendToken.ConfirmTransactionScreen, {
          payload: {
            imageUrl: selectedToken?.logoURI,
            name: selectedToken?.name,
            fee: bnAmountToString(sendFee),
            amount: bnAmountToString(amount),
            address: address,
            onConfirm: handleOnConfirm,
          },
        });
      }}
    />
  );
}
