import React, {useContext, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {usePortfolio} from 'screens/portfolio/PortfolioHook';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import PortfolioActionButton from './components/PortfolioActionButton';
import AvaListItem from 'screens/portfolio/AvaListItem';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface PortfolioHeaderProps {
  wallet: MnemonicWallet;
  scrollY: Animated.AnimatedInterpolation;
}

export const PORTFOLIO_HEADER_HEIGHT = 320;
const scrollStart = PORTFOLIO_HEADER_HEIGHT * 0.5;
const scrollEnd = PORTFOLIO_HEADER_HEIGHT * 0.8;

function PortfolioHeader({wallet, scrollY}: PortfolioHeaderProps) {
  const context = useContext(ApplicationContext);
  const [avaxPrice, walletEvmAddrBech] = usePortfolio(wallet);
  const [tokenValueOriginalY, setTokenValueOriginalY] = useState(0);

  const opacityAnimation = {
    opacity: scrollY.interpolate({
      inputRange: [0, scrollStart, scrollEnd],
      outputRange: [1, 0, 0],
      extrapolate: 'clamp',
    }),
  };

  const positionAnimation = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, scrollStart - 50, scrollEnd],
          outputRange: [0, tokenValueOriginalY, tokenValueOriginalY + 100],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container]}>
      <Animated.View>
        <AvaListItem.Account
          accountName={'My Awesome Wallet'}
          accountAddress={walletEvmAddrBech ?? ''}
        />
      </Animated.View>
      <Animated.View
        style={[positionAnimation, styles.center]}
        onLayout={({nativeEvent}) => {
          const y = nativeEvent.layout.y;
          setTokenValueOriginalY(y);
        }}>
        <Text style={[styles.amount, {color: context.theme.buttonIcon}]}>
          {`$${avaxPrice} USD`}
        </Text>
      </Animated.View>
      <Animated.View style={[opacityAnimation, styles.actionsContainer]}>
        <PortfolioActionButton.Send />
        <View style={{paddingHorizontal: 24}}>
          <PortfolioActionButton.Receive />
        </View>
        <PortfolioActionButton.Buy />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    height: PORTFOLIO_HEADER_HEIGHT,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 20,
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 36,
    lineHeight: 44,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 46,
  },
});

export default PortfolioHeader;
