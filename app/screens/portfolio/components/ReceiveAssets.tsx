import React, {useContext, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';
import BlockchainCircle from 'components/BlockchainCircle';
import Clipboard from '@react-native-clipboard/clipboard';
import {ShowSnackBar} from 'components/Snackbar';

type Props = {
  addressX: string;
  addressC: string;
  addressP: string;
};

export default function ReceiveAssets({addressX, addressC, addressP}: Props) {
  const context = useContext(ApplicationContext);
  const theme = context.theme;

  // address C is arbitrarily selected. could be any.
  const [activeAddress, setActiveAddress] = useState<string | undefined>(
    addressC,
  );

  // TODO: where are we putting the share capability
  // const onShare = (): void => {
  //   Share.share(
  //     {
  //       title: 'title',
  //       message: activeAddress ?? '',
  //     },
  //     {
  //       dialogTitle: 'dialog Title',
  //     },
  //   ).then(value => console.log(value));
  // };

  const copyToClipboard = (str?: string): void => {
    if (!str) {
      return;
    }
    Clipboard.setString(str);
    ShowSnackBar('Copied');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bgOnBgApp,
        },
      ]}>
      <View style={styles.networkContainer}>
        <View>
          <Text
            style={[
              styles.title,
              {
                color: theme.txtListItem,
              },
            ]}>
            Receive assets
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.txtListItemSubscript,
              },
            ]}>
            Long press to copy address
          </Text>
          <View style={styles.networkSelectionContainer}>
            <BlockchainCircle
              chain={'C'}
              active={activeAddress === addressC}
              onChainSelected={() => setActiveAddress(addressC)}
            />
            <BlockchainCircle
              chain={'X'}
              active={activeAddress === addressX}
              onChainSelected={() => setActiveAddress(addressX)}
            />
            <BlockchainCircle
              chain={'P'}
              active={activeAddress === addressP}
              onChainSelected={() => setActiveAddress(addressP)}
            />
          </View>
        </View>
        {!!activeAddress && (
          <View style={styles.qrDarkBackground}>
            <QRCode size={70} value={activeAddress} />
          </View>
        )}
      </View>
      <Text
        onLongPress={() => copyToClipboard(activeAddress)}
        style={[styles.networkAddress, {color: theme.txtListItem}]}>
        {activeAddress}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    margin: 24,
    borderRadius: 10,
    maxHeight: 204,
  },
  networkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  networkSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 14,
  },
  networkAddress: {
    fontSize: 14,
    lineHeight: 17,
    paddingTop: 16,
    paddingBottom: 24,
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  qrDarkBackground: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
