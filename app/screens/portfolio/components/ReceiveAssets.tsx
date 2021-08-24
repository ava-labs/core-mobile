import React, {useContext, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import {ApplicationContext} from 'contexts/ApplicationContext';
import NetworkCircle from 'components/NetworkCircle';

type Props = {
  addressX: string;
  addressC: string;
  addressP: string;
};

export default function ReceiveAssets({addressX, addressC, addressP}: Props) {
  const context = useContext(ApplicationContext);
  const isDarkMode = context.isDarkMode;

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

  const theme = context.theme;

  console.debug('activeNetworkAddress: ' + activeAddress);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#1A1A1C' : theme.bgLight,
        },
      ]}>
      <View style={styles.networkContainer}>
        <View>
          <Text
            style={[
              styles.title,
              {
                color: isDarkMode ? '#FFF' : '#1A1A1C',
              },
            ]}>
            Receive assets
          </Text>
          <Text style={styles.subtitle}>Long press to copy address</Text>
          <View style={styles.networkSelectionContainer}>
            <NetworkCircle
              network={'C'}
              active={activeAddress === addressC}
              onNetworkSelected={() => setActiveAddress(addressC)}
            />
            <NetworkCircle
              network={'X'}
              active={activeAddress === addressX}
              onNetworkSelected={() => setActiveAddress(addressX)}
            />
            <NetworkCircle
              network={'P'}
              active={activeAddress === addressP}
              onNetworkSelected={() => setActiveAddress(addressP)}
            />
          </View>
        </View>
        {!!activeAddress && (
          <View style={isDarkMode && styles.qrDarkBackground}>
            <QRCode size={70} value={activeAddress} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.networkAddress,
          {color: isDarkMode ? '#FFFFFF' : '#1A1A1C'},
        ]}>
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
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 14,
    color: '#6C6C6E',
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
