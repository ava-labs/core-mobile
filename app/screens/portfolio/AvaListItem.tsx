import React, {FC, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AccountSVG from 'components/svg/AccountSVG';
import GraphSVG from 'components/svg/GraphSVG';

interface Props {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  label?: string;
  title: string;
  subtitle?: string;
}
function BaseListItem({
  rightComponent,
  leftComponent,
  subtitle,
  label,
  title,
}: Props) {
  const context = useContext(ApplicationContext);

  return (
    <View style={{paddingVertical: 16}}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            flex: 1,
          }}>
          {leftComponent && leftComponent}
          <View style={{paddingHorizontal: 16, flex: 1}}>
            {!!label && (
              <Text
                style={{
                  color: context.theme.balloonTextTertiary,
                  fontSize: 14,
                  lineHeight: 17,
                  justifyContent: 'center',
                }}>
                {label}
              </Text>
            )}
            <Text
              style={{
                color: context.theme.balloonText,
                fontSize: 16,
                lineHeight: 24,
              }}>
              {title}
            </Text>
            {!!subtitle && (
              <Text
                ellipsizeMode="middle"
                numberOfLines={1}
                style={{
                  color: context.theme.balloonTextSecondary,
                  fontSize: 14,
                  lineHeight: 17,
                }}>
                {subtitle}
              </Text>
            )}
          </View>
          {rightComponent && rightComponent}
        </View>
      </TouchableOpacity>
    </View>
  );
}

interface CoinItemProps {
  coinName: string;
  coinPrice: number;
  avaxPrice: number;
}
const CoinItem: FC<CoinItemProps> = props => {
  const subtitle = `$${props.coinPrice} USD`;
  const label = props.coinName;
  const title = props.coinName;
  const context = useContext(ApplicationContext);

  const coinLogo = (
    <View
      style={{
        paddingHorizontal: 16,
        backgroundColor: 'red',
        width: 32,
        height: 32,
        borderRadius: 20,
      }}
    />
  );

  const sendCoin = (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <ButtonAvaTextual text={'Send'} onPress={() => {}} />
      <CarrotSVG color={context.theme.primaryColor} />
    </View>
  );

  return (
    <BaseListItem
      title={title}
      subtitle={subtitle}
      label={label}
      leftComponent={coinLogo}
      rightComponent={sendCoin}
    />
  );
};

interface AccountItemProps {
  accountName: string;
  accountAddress: string;
}
function AccountItem({accountName, accountAddress}: AccountItemProps) {
  const leftComponent = <AccountSVG />;
  const rightComponent = <GraphSVG />;

  return (
    <BaseListItem
      leftComponent={leftComponent}
      title={accountName}
      subtitle={accountAddress}
      rightComponent={rightComponent}
    />
  );
}

const AvaListItem = {
  Coin: CoinItem,
  Account: AccountItem,
};

export default AvaListItem;
