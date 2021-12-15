import React, {FC} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';
import CarrotSVG from 'components/svg/CarrotSVG';
import FlexSpacer from 'components/FlexSpacer';
import InputText from 'components/InputText';
import {useNavigation} from '@react-navigation/native';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import AppNavigation from 'navigation/AppNavigation';
import Avatar from 'components/Avatar';

interface TokenDropDownProps {
  selectedToken?: TokenWithBalance;
  onTokenSelected: (token: TokenWithBalance) => void;
  label?: string;
}

const TokenDropDown: FC<TokenDropDownProps> = ({
  selectedToken,
  onTokenSelected,
  label,
}) => {
  const context = useApplicationContext();
  const navigation = useNavigation();

  function selectToken() {
    navigation.navigate(AppNavigation.Modal.SelectToken, {onTokenSelected});
  }

  return (
    <View style={{marginHorizontal: 16, flex: 1}}>
      {label && <AvaText.Heading3>{label}</AvaText.Heading3>}
      <Space y={4} />
      <View
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            paddingStart: 16,
            paddingEnd: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: context.theme.colorBg2,
            borderRadius: 10,
            maxHeight: 70,
          },
          context.shadow,
        ]}>
        <AvaButton.Base style={{flexDirection: 'row'}} onPress={selectToken}>
          {selectedToken ? (
            <View>
              <Avatar.Token token={selectedToken} />
              <AvaText.Heading3>{selectedToken.symbol}</AvaText.Heading3>
            </View>
          ) : (
            <AvaText.Heading3>Select</AvaText.Heading3>
          )}
          <Space x={8} />
          <CarrotSVG
            direction={'down'}
            size={12}
            color={context.theme.colorText1}
          />
        </AvaButton.Base>
        <FlexSpacer />
        <InputText
          placeholder="Enter the amount"
          keyboardType="numeric"
          onChangeText={text => {
            console.log('amount: ' + text);
          }}
        />
      </View>
      <Space y={8} />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <AvaText.Body3 color={context.theme.colorError}>Error</AvaText.Body3>
        <AvaText.Body2>
          {selectedToken ? `${selectedToken.priceUSD} USD` : '$0.00 USD'}
        </AvaText.Body2>
      </View>
    </View>
  );
};

export default TokenDropDown;
