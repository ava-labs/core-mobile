import React, {useContext} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AccountSVG from 'components/svg/AccountSVG';
import SearchSVG from 'components/svg/SearchSVG';

interface Props {
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
  label?: string;
  title: string | React.ReactNode;
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
            <>
              {typeof title === 'string' ? (
                <Text
                  style={{
                    color: context.theme.balloonText,
                    fontSize: 16,
                    lineHeight: 24,
                  }}>
                  {title}
                </Text>
              ) : (
                {title}
              )}
            </>
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
  image?: string;
  symbol?: string;
}
function CoinItem({
  coinName,
  coinPrice,
  avaxPrice,
  image,
  symbol,
}: CoinItemProps) {
  const label = coinName;
  const title = coinName;
  const context = useContext(ApplicationContext);

  const coinLogo = (
    <Image
      style={{
        paddingHorizontal: 16,
        width: 32,
        height: 32,
        borderRadius: 20,
        overflow: 'hidden',
      }}
      source={{uri: image}}
    />
  );

  const sendCoin = (
    <View style={{alignItems: 'flex-end'}}>
      <Text
        style={{
          fontWeight: 'bold',
          fontSize: 16,
          lineHeight: 24,
          color: context.isDarkMode ? '#F8F8FB' : '#1A1A1C',
        }}>
        {`${coinPrice} ${symbol?.toUpperCase()}`}
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 17,
          color: context.isDarkMode ? '#B4B4B7' : '#6C6C6E',
        }}>
        {`${coinPrice} USD`}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        marginHorizontal: 8,
        backgroundColor: context.theme.cardBg,
        borderRadius: 8,
        marginVertical: 4,
        shadowColor: '#1A1A1A',
        shadowOffset: {
          width: 0,
          height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,

        elevation: 5,
      }}>
      <BaseListItem
        title={title}
        leftComponent={coinLogo}
        rightComponent={sendCoin}
      />
    </View>
  );
}

interface AccountItemProps {
  accountName: string;
  accountAddress: string;
}
function AccountItem({accountName, accountAddress}: AccountItemProps) {
  const leftComponent = <AccountSVG />;
  const rightComponent = <SearchSVG />;

  function buildTitle() {
    return (
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 100,
          borderWidth: 1,
          borderColor: '#3A3A3C',
        }}>
        <Text>{accountAddress}</Text>
        <View style={{transform: [{rotate: '90deg'}]}}>
          <CarrotSVG />
        </View>
      </View>
    );
  }

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
