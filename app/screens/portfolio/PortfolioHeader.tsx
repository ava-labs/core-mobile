import React, {useContext} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {usePortfolio} from 'screens/portfolio/usePortfolio';

export const HEADER_MAX_HEIGHT = 150;
export const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 60 : 73;
export const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

function PortfolioHeader() {
  const context = useContext(ApplicationContext);
  const {addressC, balanceTotalInUSD} = usePortfolio();

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.header,
          {
            // while we wait for the proper background from UX
            backgroundColor: context.theme.bgOnBgApp,
          },
        ]}
      />

      <View style={[styles.bar]} pointerEvents="box-none">
        <View>
          <AvaListItem.Account
            accountName={'My Awesome Wallet'}
            accountAddress={addressC ?? ''}
          />
        </View>
        <View
          style={{
            alignItems: 'flex-end',
            justifyContent: 'center',
            flexDirection: 'row',
          }}>
          <Text style={[styles.text, {color: context.theme.txtOnBgApp}]}>
            {balanceTotalInUSD}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: context.theme.txtOnBgApp,
              paddingLeft: 4,
              lineHeight: 28,
            }}>
            USD
          </Text>
        </View>
      </View>
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
    fontSize: 36,
    fontWeight: 'bold',
  },
  header: {
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
