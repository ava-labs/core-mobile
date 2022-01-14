import React from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {SendTokenNavigationProp} from 'screens/sendERC20/SendERC20Stack';
import {useGasPrice} from 'utils/GasPriceHook';
import {
  useSendAvax,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {bnAmountToString} from 'dto/SendInfo';
import SendForm from 'screens/send/SendForm';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import {Utils} from '@avalabs/avalanche-wallet-sdk';

export default function SendAvax(): JSX.Element {
  const {selectedToken} = useSelectedTokenContext();
  const {avaxPrice} = useWalletStateContext();
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
    gasLimit,
    gasPrice,
  } = useSendAvax(gasPrice$);
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

    submit().subscribe({
      next: value => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error');
        } else {
          if ('txId' in value && value.txId) {
            navigate(AppNavigation.SendToken.DoneScreen, {
              transactionId: value.txId,
            });
            onSuccess();
          }
        }
      },
      error: err => {
        onError(err);
      },
    });
  }

  return (
    <SendForm
      setAmount={setAmount}
      amount={amount}
      priceUSD={amount ? avaxPrice : 0}
      canSubmit={canSubmit}
      error={error}
      sendFee={sendFee}
      address={address}
      setAddress={setAddress}
      gasLimit={gasLimit}
      gasPrice={gasPrice}
      denomination={selectedToken?.denomination ?? 0}
      onNextPress={() => {
        navigate(AppNavigation.SendToken.ConfirmTransactionScreen, {
          payload: {
            imageUrl: selectedToken?.logoURI,
            name: selectedToken?.name,
            fee: bnAmountToString(sendFee),
            amount: bnAmountToString(amount),
            amountUSD: Utils.bnToBig(amount!, 18)
              .mul(avaxPrice)
              .toNumber()
              .toFixed(3),
            address: address,
            onConfirm: handleOnConfirm,
          },
        });
      }}
    />
  );
}
