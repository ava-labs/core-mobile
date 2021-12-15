import React, {FC, useEffect, useState} from 'react';
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
import {useSwapContext} from 'contexts/SwapContext';

interface TokenDropDownProps {
  type?: 'From' | 'To';
}

const TokenDropDown: FC<TokenDropDownProps> = ({type}) => {
  const context = useApplicationContext();
  const navigation = useNavigation();
  const swapContext = useSwapContext();

  const isFrom = type === 'From';

  const selectedToken = isFrom
    ? swapContext.swapFrom.token
    : swapContext.swapTo.token;
  const usdValue = isFrom
    ? swapContext.swapFrom.usdValue
    : swapContext.swapTo.usdValue;
  const setAmount = isFrom
    ? swapContext.swapFrom.setAmount
    : swapContext.swapTo.setAmount;
  const setToken = isFrom
    ? swapContext.swapFrom.setToken
    : swapContext.swapTo.setToken;
  const amount = isFrom
    ? swapContext.swapFrom.amount
    : swapContext.swapTo.amount;

  function selectToken() {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        setToken(token);
      },
    });
  }

  return (
    <View style={{marginHorizontal: 16, flex: 1}}>
      {type && <AvaText.Heading3>{type}</AvaText.Heading3>}
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
        <AvaButton.Base
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={selectToken}>
          {selectedToken ? (
            <>
              <Avatar.Custom
                name={selectedToken.name}
                symbol={selectedToken.symbol}
                logoUri={selectedToken.logoURI}
              />
              <Space x={8} />
              <AvaText.Heading3>{selectedToken.symbol}</AvaText.Heading3>
            </>
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
            setAmount(Number.parseFloat(text));
          }}
          text={amount.toString()}
        />
      </View>
      <Space y={8} />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <AvaText.Body3 color={context.theme.colorError}>Error</AvaText.Body3>
        <AvaText.Body2>
          {selectedToken ? `${usdValue} USD` : '$0.00 USD'}
        </AvaText.Body2>
      </View>
    </View>
  );
};

export default TokenDropDown;
