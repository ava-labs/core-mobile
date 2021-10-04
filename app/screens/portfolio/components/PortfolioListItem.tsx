import React, {FC, useContext} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';

interface Props {
  tokenName: string;
  tokenPrice: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
}

const PortfolioListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  image,
  symbol,
  onPress,
}) => {
  const theme = useContext(ApplicationContext).theme;
  const title = tokenName;

  const tokenLogo =
    symbol === 'AVAX' ? (
      <AvaLogoSVG
        size={32}
        logoColor={theme.logoColor}
        backgroundColor={theme.txtOnBgApp}
      />
    ) : (
      <Image style={styles.tokenLogo} source={{uri: image}} />
    );

  const info = (
    <View style={{alignItems: 'flex-end'}}>
      <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
        {`${tokenPrice} ${symbol?.toUpperCase()}`}
      </Text>
      <Text style={[styles.tokenUsdValue, {color: theme.txtListItemSubscript}]}>
        {`${tokenPrice} USD`}
      </Text>
    </View>
  );

  return (
    <>
      <AvaListItem.Base
        title={title}
        leftComponent={tokenLogo}
        rightComponent={info}
        onPress={onPress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tokenItem: {
    marginHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  tokenNativeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24,
  },
  tokenUsdValue: {
    fontSize: 14,
    lineHeight: 17,
  },
});

export default PortfolioListItem;
