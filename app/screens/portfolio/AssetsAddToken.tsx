import React, {useContext, useEffect, useState} from 'react';
import {Alert, SafeAreaView, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import Header from 'screens/mainView/Header';
import AssetsAddTokenViewModel from './AssetsAddTokenViewModel';
import InputText from 'components/InputText';
import ButtonAva from 'components/ButtonAva';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  onClose: () => void;
};

export default function AssetsAddToken(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);
  const [viewModel] = useState(new AssetsAddTokenViewModel());
  const [backgroundStyle] = useState(context.backgroundStyle);
  const [tokenContractAddress, setTokenContractAddress] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [addTokenBtnDisabled, setAddTokenBtnDisabled] = useState(true);

  useEffect(() => {
    viewModel.tokenContractAddress.subscribe(value =>
      setTokenContractAddress(value),
    );
    viewModel.tokenName.subscribe(value => setTokenName(value));
    viewModel.tokenDecimals.subscribe(value => setTokenDecimals(value));
    viewModel.tokenSymbol.subscribe(value => setTokenSymbol(value));
    viewModel.errorMsg.subscribe(value => setErrorMsg(value));
    viewModel.addTokenBtnDisabled.subscribe(value =>
      setAddTokenBtnDisabled(value),
    );
  }, []);

  const setContractAddress = (address: string): void => {
    viewModel.setAddress(address);
  };

  const onAddToken = (): void => {
    viewModel.onAddToken().subscribe({
      error: err => Alert.alert('Error', err.message),
      complete: () =>
        Alert.alert('Success', '', [
          {text: 'Ok', onPress: () => props.onClose()},
        ]),
    });
  };

  const THEME = context.theme;
  return (
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <TextTitle text={'Add Token'} />
      <TextTitle text={'Token Contract Address'} size={18} />
      <InputText
        multiline={true}
        onChangeText={text => setContractAddress(text)}
        value={tokenContractAddress}
      />

      <TextTitle
        textAlign={'center'}
        text={errorMsg}
        size={18}
        color={THEME.txtError}
      />

      <TextTitle text={'Token Name'} size={18} />
      <InputText editable={false} multiline={true} value={tokenName} />

      <TextTitle text={'Token Symbol'} size={18} />
      <InputText editable={false} multiline={true} value={tokenSymbol} />

      <TextTitle text={'Decimals of Precision'} size={18} />
      <InputText editable={false} multiline={true} value={tokenDecimals} />

      <View style={[{flexGrow: 1, justifyContent: 'flex-end'}]}>
        <ButtonAva
          disabled={addTokenBtnDisabled}
          text={'Add token'}
          onPress={onAddToken}
        />
      </View>
    </SafeAreaView>
  );
}
