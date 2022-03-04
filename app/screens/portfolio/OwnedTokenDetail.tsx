import {View} from 'react-native';
import {Space} from 'components/Space';
import React, {useEffect, useState} from 'react';
import AvaText from 'components/AvaText';
import AvaListItem from 'components/AvaListItem';
import Avatar from 'components/Avatar';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import {getTokenUID} from 'utils/TokenTools';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {Row} from 'components/Row';
import AvaButton from 'components/AvaButton';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import ActivityList from 'screens/activity/ActivityList';

const OwnedTokenDetail = () => {
  const {tokenId} = useRoute<RouteProp<RootStackParamList>>().params;
  const {navigate} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {filteredTokenList} = useSearchableTokenList(false);
  const [token, setToken] = useState<TokenWithBalance>();

  useEffect(() => {
    if (filteredTokenList) {
      const result = filteredTokenList.filter(
        tk => getTokenUID(tk) === tokenId,
      );
      if (result.length > 0) {
        setToken(result[0]);
      }
    }
  }, [filteredTokenList]);

  return (
    <View style={{paddingHorizontal: 16, flex: 1}}>
      <Space y={8} />
      <View style={{marginHorizontal: -16}}>
        <AvaListItem.Base
          title={<AvaText.Heading2>{token?.name}</AvaText.Heading2>}
          titleAlignment={'flex-start'}
          subtitle={(token?.balanceDisplayValue ?? '0') + ' ' + token?.symbol}
          leftComponent={
            <Avatar.Custom
              name={token?.name ?? ''}
              symbol={token?.symbol}
              logoUri={token?.logoURI}
              size={40}
            />
          }
          rightComponent={
            <AvaText.Heading3 currency ellipsizeMode={'tail'}>
              {token?.balanceUsdDisplayValue ?? '0'}
            </AvaText.Heading3>
          }
        />
      </View>
      <Space y={16} />
      <Row>
        <View style={{flex: 1}}>
          <AvaButton.PrimaryMedium
            onPress={() => navigate(AppNavigation.Wallet.ReceiveTokens)}>
            Receive
          </AvaButton.PrimaryMedium>
        </View>
        <Space x={16} />
        <View style={{flex: 1}}>
          <AvaButton.PrimaryMedium
            onPress={() =>
              navigate(AppNavigation.Wallet.SendTokens, {token: token})
            }>
            Send
          </AvaButton.PrimaryMedium>
        </View>
      </Row>
      <Space y={16} />
      <AvaText.Heading3> Activity </AvaText.Heading3>
      <ActivityList tokenSymbolFilter={token?.symbol} />
    </View>
  );
};

export default OwnedTokenDetail;
