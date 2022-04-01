import {View} from 'react-native';
import {Space} from 'components/Space';
import React, {FC, useEffect, useState} from 'react';
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

const OwnedTokenDetail: FC = () => {
  const tokenId =
    useRoute<
      RouteProp<
        RootStackParamList,
        typeof AppNavigation.Wallet.OwnedTokenDetail
      >
    >()?.params?.tokenId;
  const {navigate} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {filteredTokenList} = useSearchableTokenList(false);
  const [token, setToken] = useState<TokenWithBalance>();

  useEffect(loadToken, [filteredTokenList, tokenId]);

  function loadToken() {
    if (filteredTokenList) {
      const result = filteredTokenList.filter(
        tk => getTokenUID(tk) === tokenId,
      );
      if (result.length > 0) {
        setToken(result[0]);
      }
    }
  }

  const subtitle = (
    <Row style={{alignItems: 'center'}}>
      <AvaText.Body1>{token?.balanceDisplayValue ?? '0'}</AvaText.Body1>
      <AvaText.Body2>{' ' + token?.symbol}</AvaText.Body2>
    </Row>
  );
  return (
    <View style={{paddingHorizontal: 16, flex: 1}}>
      <AvaText.LargeTitleBold>Token Details</AvaText.LargeTitleBold>
      <Space y={8} />
      <View style={{marginHorizontal: -16}}>
        <AvaListItem.Base
          title={<AvaText.Heading1>{token?.name}</AvaText.Heading1>}
          titleAlignment={'flex-start'}
          subtitle={subtitle}
          leftComponent={
            <Avatar.Custom
              name={token?.name ?? ''}
              symbol={token?.symbol}
              logoUri={token?.logoURI}
              size={40}
            />
          }
          rightComponent={
            <AvaText.Body1
              textStyle={{marginTop: 4}}
              currency
              ellipsizeMode={'tail'}>
              {token?.balanceUsdDisplayValue ?? '0'}
            </AvaText.Body1>
          }
        />
      </View>
      <Space y={16} />
      <Row>
        <View style={{flex: 1}}>
          <AvaButton.SecondaryMedium
            onPress={() => navigate(AppNavigation.Wallet.ReceiveTokens)}>
            Receive
          </AvaButton.SecondaryMedium>
        </View>
        <Space x={16} />
        <View style={{flex: 1}}>
          <AvaButton.SecondaryMedium
            onPress={() =>
              navigate(AppNavigation.Wallet.SendTokens, {token: token})
            }>
            Send
          </AvaButton.SecondaryMedium>
        </View>
      </Row>
      <Space y={24} />
      <AvaText.Heading2>Activity</AvaText.Heading2>
      <View style={{marginHorizontal: -16, flex: 1}}>
        <ActivityList tokenSymbolFilter={token?.symbol} embedded />
      </View>
    </View>
  );
};

export default OwnedTokenDetail;
