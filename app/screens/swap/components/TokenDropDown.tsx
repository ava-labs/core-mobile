import React, {FC, useEffect, useState} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';
import CarrotSVG from 'components/svg/CarrotSVG';
import InputText from 'components/InputText';
import {useNavigation} from '@react-navigation/native';
import {
  ERC20WithBalance,
  TokenWithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AppNavigation from 'navigation/AppNavigation';
import Avatar from 'components/Avatar';
import {useSwapContext} from 'contexts/SwapContext';
import {getTokenUID} from 'utils/TokenTools';
import numeral from 'numeral';
import FlexSpacer from 'components/FlexSpacer';

interface TokenDropDownProps {
  type?: 'From' | 'To';
  error?: string;
}

const TokenDropDown: FC<TokenDropDownProps> = ({type, error}) => {
  const context = useApplicationContext();
  const navigation = useNavigation();
  const swapContext = useSwapContext();
  const {avaxToken, erc20Tokens} = useWalletStateContext()!;
  const [srcTokenBalance, setSrcTokenBalance] = useState('-');
  const [maxAmount, setMaxAmount] = useState(0);

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

  useEffect(() => {
    if (!swapContext.swapFrom.token) {
      setSrcTokenBalance('-');
      return;
    }

    const srcTokenUid = getTokenUID(swapContext.swapFrom.token!);
    const tokenWithBal =
      srcTokenUid === getTokenUID(avaxToken)
        ? avaxToken
        : (erc20Tokens as ERC20WithBalance[]).find(
            erc20Token => srcTokenUid === getTokenUID(erc20Token),
          );

    if (tokenWithBal) {
      setSrcTokenBalance(
        `${tokenWithBal.balanceDisplayValue} ${tokenWithBal.symbol}`,
      );
      setMaxAmount(numeral(tokenWithBal.balanceDisplayValue).value());
    } else {
      setSrcTokenBalance('-');
      setMaxAmount(0);
    }
  }, [swapContext.swapFrom.token]);

  function selectToken() {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        setToken(token);
      },
    });
  }

  return (
    <View style={{marginHorizontal: 16, flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
        {type && <AvaText.Heading3>{type}</AvaText.Heading3>}
        {isFrom && <AvaText.Body2>{srcTokenBalance}</AvaText.Body2>}
      </View>
      <Space y={4} />
      <View
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: context.theme.colorBg2,
            borderRadius: 10,
          },
          context.shadow,
        ]}>
        <AvaButton.Base
          style={{flexDirection: 'row', alignItems: 'center', padding: 16}}
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
        <View style={{flex: 1}}>
          <InputText
            mode={'amount'}
            keyboardType="numeric"
            onMax={isFrom ? () => setAmount(maxAmount) : undefined}
            onChangeText={text => {
              setAmount(Number.parseFloat(text));
            }}
            text={amount.toString()}
          />
        </View>
      </View>
      <Space y={8} />
      <View
        style={{
          flexDirection: 'row',
        }}>
        {error && (
          <AvaText.Body3 color={context.theme.colorError}>
            {error}
          </AvaText.Body3>
        )}
        <FlexSpacer />
        <AvaText.Body2>
          {selectedToken
            ? `${numeral(usdValue).format('0[.0000]a')} USD`
            : '$0.00 USD'}
        </AvaText.Body2>
      </View>
    </View>
  );
};

export default TokenDropDown;
