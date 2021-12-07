import React, {useEffect} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {SendTokenNavigationProp} from 'screens/sendERC20/SendERC20Stack';
import {
  ERC20WithBalance,
  sendErc20Submit,
  useSendErc20Form,
  useWalletContext,
} from '@avalabs/wallet-react-components';
import {useGasPrice} from 'utils/GasPriceHook';
import {bnAmountToString} from 'dto/SendInfo';
import SendForm from 'screens/send/SendForm';
import {firstValueFrom} from 'rxjs';
import BN from 'bn.js';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';

export default function SendERC20(): JSX.Element {
  const token = useSelectedTokenContext().selectedToken as ERC20WithBalance;
  const wallet = useWalletContext()?.wallet;
  const {navigate} = useNavigation<SendTokenNavigationProp>();
  const {gasPrice$} = useGasPrice();
  const {
    setAmount,
    setAddress,
    canSubmit,
    error,
    sendFee,
    amount,
    address,
    setTokenBalances,
  } = useSendErc20Form(token, gasPrice$);

  useEffect(() => {
    setTokenBalances({[token.address]: token});
  }, []);

  async function handleOnConfirm(doneLoading: () => void) {
    if (!address) {
      Alert.alert('Error', 'Address not set ');
      return;
    }
    if (!amount || amount.isZero()) {
      Alert.alert('Error', 'Amount not set ');
      return;
    }

    sendErc20Submit(
      token,
      Promise.resolve(wallet),
      amount,
      address,
      firstValueFrom(gasPrice$),
    ).subscribe({
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

  function handleSetAmount(txAmount: BN) {
    setAmount(txAmount);
  }

  return (
    <SendForm
      setAmount={handleSetAmount}
      amount={amount}
      priceUSD={amount ? token?.priceUSD : 0}
      canSubmit={canSubmit}
      error={error}
      sendFee={sendFee}
      address={address}
      setAddress={setAddress}
      onNextPress={() => {
        navigate(AppNavigation.SendToken.ConfirmTransactionScreen, {
          payload: {
            imageUrl: token?.logoURI,
            name: token?.name,
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
