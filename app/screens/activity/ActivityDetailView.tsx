import React, {useEffect, useState} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import LinkSVG from 'components/svg/LinkSVG';
import AvaButton from 'components/AvaButton';
import {HistoryItemType} from '@avalabs/avalanche-wallet-sdk/dist/History';
import moment from 'moment';
import MovementIndicator from 'components/MovementIndicator';
import {Utils} from '@avalabs/avalanche-wallet-sdk';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';

interface Props {
  txItem: HistoryItemType;
}
function ActivityDetailView({txItem}: Props) {
  const theme = useApplicationContext().theme;
  const networkContext = useNetworkContext();
  const date = moment(txItem.timestamp).format('MMM DD, YYYY HH:mm');
  const [explorerUrl, setExplorerUrl] = useState<string>();

  useEffect(() => {
    if (networkContext) {
      const isTestNt = networkContext.network === FUJI_NETWORK;
      setExplorerUrl(
        `https://explorer.avax${isTestNt ? '-test' : ''}.network/tx/${
          txItem.id
        }`,
      );
    }
  }, [networkContext]);

  function getValue() {
    return (
      ('amountDisplayValue' in txItem && txItem?.amountDisplayValue) ?? '0'
    );
  }

  function getMetric() {
    if (
      txItem?.type === 'export' ||
      ('isSender' in txItem && txItem?.isSender)
    ) {
      return -1;
    }
    return 0;
  }

  function getFee() {
    // todo: calculate correct fee
    return Utils.bnToAvaxX(txItem.fee);
  }

  function getSource() {
    if ('source' in txItem) {
      return txItem.source;
    }
    if ('from' in txItem) {
      return txItem.from;
    }
  }

  // function getDestination() {
  //   if ('destination' in txItem) {
  //     return txItem.destination;
  //   }
  //   if ('to' in txItem) {
  //     return txItem.to;
  //   }
  // }

  return (
    <View
      style={[
        {
          justifyContent: 'center',
          padding: 16,
        },
        {backgroundColor: theme.bgOnBgApp},
      ]}>
      <View style={styles.logoContainer}>
        <AvaText.Heading1>Transaction Details</AvaText.Heading1>
        <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
          {`${date} - Bal: -`}
        </AvaText.Body2>

        <AvaLogoSVG size={32} />

        <AvaText.Heading1 textStyle={{paddingTop: 16}}>
          {`${getValue()} AVAX`}
        </AvaText.Heading1>
        <AvaText.Body2 textStyle={{paddingTop: 8, paddingBottom: 32}}>
          {`$0 - ${txItem?.fee && 'Fee: ' + getFee()} AVAX`}
        </AvaText.Body2>
      </View>
      <AvaListItem.Base
        label={'From'}
        leftComponent={<MovementIndicator metric={getMetric()} />}
        title={getSource()}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {!!explorerUrl && (
          <>
            <LinkSVG />
            <AvaButton.TextLarge
              onPress={() => {
                Linking.openURL(explorerUrl);
              }}>
              View on Explorer
            </AvaButton.TextLarge>
          </>
        )}
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

export default ActivityDetailView;
