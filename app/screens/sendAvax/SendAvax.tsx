import React from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {SendTokenNavigationProp} from 'screens/sendERC20/SendERC20Stack';
import {useGasPrice} from 'utils/GasPriceHook';
import {useSendAvax} from '@avalabs/wallet-react-components';
import {bnAmountToString} from 'dto/SendInfo';
import SendForm from 'screens/send/SendForm';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';

export default function SendAvax(): JSX.Element {
  const {selectedToken} = useSelectedTokenContext();
  const {gasPrice$} = useGasPrice();
  const {
    submit,
    setAmount,
    setAddress,
    amount,
    address,
    error,
    canSubmit,
    sendFee,
  } = useSendAvax(gasPrice$);
  const {navigate} = useNavigation<SendTokenNavigationProp>();

  async function handleOnConfirm(doneLoading: () => void) {
    submit().subscribe({
      next: value => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error');
        } else {
          if ('txId' in value && value.txId) {
            console.log(value);
            navigate(AppNavigation.SendToken.DoneScreen);
            doneLoading();
          }
        }
      },
      error: err => {
        Alert.alert('Error', err.message);
      },
    });
  }

  return (
    <SendForm
      setAmount={setAmount}
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
