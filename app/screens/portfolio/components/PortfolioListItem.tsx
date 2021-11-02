import React, {FC, useContext} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';

interface Props {
  tokenName: string;
  tokenPrice: string;
  tokenPriceUsd?: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
}

const PortfolioListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceUsd,
  image,
  symbol,
  onPress,
}) => {
  const theme = useApplicationContext().theme;
  const title = tokenName;

  const tokenLogo =
    symbol === 'AVAX' ? (
      <AvaLogoSVG
        size={32}
        logoColor={theme.white}
        backgroundColor={theme.logoColor}
      />
    ) : (
      <Image style={styles.tokenLogo} source={{uri: image}} />
    );

  const subTitle = (
    <AvaText.Body2>{`${tokenPrice} ${symbol?.toUpperCase()}`}</AvaText.Body2>
  );

  const usdBalance = tokenPriceUsd ? (
    <AvaText.Heading3>{`$${tokenPriceUsd} USD`}</AvaText.Heading3>
  ) : undefined;

  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.bgOnBgApp,
      }}>
      <AvaListItem.Base
        title={title}
        subtitle={subTitle}
        leftComponent={tokenLogo}
        rightComponent={usdBalance}
        onPress={onPress}
      />
    </View>
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
