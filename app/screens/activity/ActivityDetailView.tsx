import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import LinkSVG from 'components/svg/LinkSVG';
import AvaButton from 'components/AvaButton';
import {HistoryItemType} from '@avalabs/avalanche-wallet-sdk/dist/History';
import moment from 'moment';
import MovementIndicator from 'components/MovementIndicator';
import {bnToLocaleString} from '@avalabs/avalanche-wallet-sdk';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import {Space} from 'components/Space';
import Config from 'react-native-config';
import useInAppBrowser from 'hooks/useInAppBrowser';

interface Props {
  txItem: HistoryItemType;
}

function ActivityDetailView({txItem}: Props) {
  const theme = useApplicationContext().theme;
  const networkContext = useNetworkContext();
  const date = moment(txItem.timestamp).format('MMM DD, YYYY HH:mm');
  const [explorerUrl, setExplorerUrl] = useState<string>();
  const {openUrl} = useInAppBrowser();

  useEffect(() => {
    if (networkContext) {
      const isTestNt = networkContext.network === FUJI_NETWORK;
      setExplorerUrl(
        `${
          isTestNt ? Config.SNOWTRACE_TESTNET_URL : Config.SNOWTRACE_MAINNET_URL
        }/tx/${txItem.id}`,
      );
    }
  }, [networkContext]);

  const isOutboundTransaction = useMemo(
    () =>
      txItem?.type === 'export' || ('isSender' in txItem && txItem?.isSender),
    [],
  );

  const amount = useMemo(
    () =>
      ('amountDisplayValue' in txItem &&
        `${isOutboundTransaction ? '-' : '+'}${txItem?.amountDisplayValue}`) ??
      '0',
    [],
  );

  const fee = useMemo(() => bnToLocaleString(txItem.fee, 18), []);

  const source = useMemo(() => {
    if ('source' in txItem) {
      return txItem.source;
    }
    if ('from' in txItem) {
      return txItem.from;
    }
  }, []);

  const tokenLogo = (
    // 'AVAX' === 'AVAX' ? (
    <AvaLogoSVG
      size={32}
      logoColor={theme.white}
      backgroundColor={theme.logoColor}
    />
  );
  // ) : (
  //   <Image style={styles.tokenLogo} source={{uri: image}} />
  // );

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
          flex: 1,
        },
      ]}>
      <View style={styles.logoContainer}>
        <AvaText.Heading1>Transaction Details</AvaText.Heading1>
        <AvaText.Body2 textStyle={{marginTop: 8}}>{`${date}`}</AvaText.Body2>
        <Space y={32} />
        {tokenLogo}
        <AvaText.Heading1
          textStyle={{marginTop: 16}}
          color={isOutboundTransaction ? theme.colorError : theme.colorIcon3}>
          {`${amount} AVAX`}
        </AvaText.Heading1>
        <AvaText.Body2 textStyle={{marginTop: 8}}>
          {`$0 USD - ${txItem?.fee && 'Fee: ' + fee} AVAX`}
        </AvaText.Body2>
      </View>
      <Space y={16} />
      <AvaListItem.Base
        label={
          <AvaText.Body2>{isOutboundTransaction ? 'To' : 'From'}</AvaText.Body2>
        }
        leftComponent={
          <MovementIndicator metric={isOutboundTransaction ? -1 : 0} />
        }
        title={source}
      />
      {!!explorerUrl && (
        <>
          {/* AvaListItem already contains a 16 bottom margin. With 8 makes the total 24 as per design */}
          <Space y={8} />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 12,
            }}>
            <LinkSVG />
            <AvaButton.TextLarge
              onPress={() => {
                openUrl(explorerUrl);
              }}>
              View on Explorer
            </AvaButton.TextLarge>
          </View>
          <Space y={16} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    marginTop: 8,
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
