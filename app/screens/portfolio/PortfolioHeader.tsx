import React, {useContext} from 'react';
import {Animated, Platform, StyleSheet, Text, View} from 'react-native';
import {usePortfolio} from 'screens/portfolio/PortfolioHook';
import PortfolioActionButton from './components/PortfolioActionButton';
import AvaListItem from 'screens/portfolio/AvaListItem';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface PortfolioHeaderProps {
  scrollY: Animated.AnimatedInterpolation;
}

export const HEADER_MAX_HEIGHT = 260;
export const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 60 : 73;
export const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

function PortfolioHeader({scrollY}: PortfolioHeaderProps) {
  const context = useContext(ApplicationContext);
  const [addressX, addressP, addressC, balanceTotalInUSD] = usePortfolio();

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 3, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });
  const imageTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -300],
    extrapolate: 'clamp',
  });

  const titleTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [
      0,
      -(HEADER_SCROLL_DISTANCE / 4),
      -(HEADER_SCROLL_DISTANCE / 2),
    ],
    extrapolate: 'clamp',
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.header,
          {
            // while we wait for the proper background from UX
            backgroundColor: context.isDarkMode
              ? '#000'
              : context.theme.tcwbBg2,
            transform: [{translateY: headerTranslate}],
          },
        ]}
      />

      <Animated.View style={[styles.bar]} pointerEvents="box-none">
        <Animated.View style={{opacity: imageOpacity}}>
          <AvaListItem.Account
            accountName={'My Awesome Wallet'}
            accountAddress={addressC ?? ''}
          />
        </Animated.View>
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{translateY: titleTranslate}],
          }}>
          <Text style={[styles.text, {color: context.theme.buttonIcon}]}>
            {balanceTotalInUSD}
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            opacity: imageOpacity,
            transform: [{translateY: imageTranslate}],
          }}>
          <Animated.View style={[styles.actionsContainer]}>
            <PortfolioActionButton.Send />
            <View style={{paddingHorizontal: 24}}>
              <PortfolioActionButton.Receive />
            </View>
            <PortfolioActionButton.Buy />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
}

// @ts-ignore
const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 30,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    height: HEADER_MAX_HEIGHT,
  },
  bar: {
    backgroundColor: 'transparent',
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    height: HEADER_MAX_HEIGHT,
    justifyContent: 'space-between',
    position: 'absolute',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingBottom: 8,
  },
});

export default PortfolioHeader;
