import React from 'react';
import {View} from 'react-native';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import AvaText from 'components/AvaText';
import AppNavigation from 'navigation/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import {PortfolioNavigationProp} from 'screens/portfolio/PortfolioView';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import {Space} from 'components/Space';
import TokenSelector from 'screens/send/TokenSelector';

function SendToken(): JSX.Element {
  const navigation = useNavigation<PortfolioNavigationProp>();
  const {setSelectedToken} = useSelectedTokenContext();

  function selectToken(token: TokenWithBalance) {
    setSelectedToken?.(token);
    navigation.navigate(AppNavigation.Modal.SendReceiveBottomSheet);
  }

  return (
    <View style={{flex: 1, marginHorizontal: 16}}>
      <Space y={8} />
      <AvaText.Heading1>Send Tokens</AvaText.Heading1>
      <Space y={24} />
      <AvaText.Body1>Choose asset to continue</AvaText.Body1>
      <Space y={16} />
      <TokenSelector onTokenSelected={selectToken} />
    </View>
  );
}

export default SendToken;
