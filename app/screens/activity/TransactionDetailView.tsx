import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import LinkSVG from 'components/svg/LinkSVG';
import ArrowSVG from 'components/svg/ArrowSVG';
import AvaButton from 'components/AvaButton';

function TransactionDetailView(): JSX.Element {
  const theme = useContext(ApplicationContext).theme;

  const tokenLogo = (
    <View
      style={[
        styles.tokenLogo,
        {
          backgroundColor: '#F1595A33',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}>
      <ArrowSVG color={'#E6787B'} />
    </View>
  );

  return (
    <View
      style={{
        justifyContent: 'center',
        padding: 16,
        backgroundColor: theme.bgApp,
      }}>
      <View style={styles.logoContainer}>
        <AvaText.Heading1>Transaction Details</AvaText.Heading1>
        <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
          Sep 10, 2021 09:00 am - Bal: $89.700,01
        </AvaText.Body2>

        <AvaLogoSVG size={32} />

        <AvaText.Heading1 textStyle={{paddingTop: 16}}>
          -10.02 LINK
        </AvaText.Heading1>
        <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
          $434.59 USD - Fee: 0.01 AVAX
        </AvaText.Body2>
      </View>
      <AvaListItem.Base
        leftComponent={tokenLogo}
        label={'From'}
        title={'Xfuji1hul6q0w383863v6kejul2psaeumcwee5fzzk2e'}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <LinkSVG />
        <AvaButton.TextLarge onPress={() => {}}>
          View on Explorer
        </AvaButton.TextLarge>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default TransactionDetailView;
