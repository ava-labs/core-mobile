import React, {FC, useEffect} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {
  Blockchain,
  TrackerViewProps,
  TransactionDetails,
  useBridgeConfig,
  useBridgeSDK,
  useTxTracker,
} from '@avalabs/bridge-sdk';
import {BridgeTransaction, useBridgeContext} from 'contexts/BridgeContext';
import {
  TransactionNormal,
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {ShowSnackBar} from 'components/Snackbar';
import AvaText from 'components/AvaText';
import AvaListItem from 'components/AvaListItem';
import BridgeSVG from 'components/svg/BridgeSVG';
import {Opacity10} from 'resources/Constants';
import {StyleSheet, View} from 'react-native';
import AppNavigation from 'navigation/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import Spinner from 'components/Spinner';

type TransactionBridgeItem = BridgeTransaction &
  TransactionNormal &
  TransactionDetails;

interface BridgeTransactionItemProps {
  item: TransactionBridgeItem;
  onPress: () => void;
}

const BridgeTransactionItem: FC<BridgeTransactionItemProps> = ({
  item,
  onPress,
}) => {
  const theme = useApplicationContext().theme;
  const fromAvalancheToEthereum =
    item.sourceNetwork === Blockchain.AVALANCHE ||
    item.to === '0x0000000000000000000000000000000000000000';
  const {network} = useNetworkContext();
  const {config} = useBridgeConfig();
  const {removeBridgeTransaction} = useBridgeContext();
  const {addresses} = useWalletStateContext();
  const {transactionDetails, bridgeAssets, setTransactionDetails} =
    useBridgeSDK();
  const navigation = useNavigation();

  const pending = 'complete' in item && !item.complete;

  if (pending) {
    console.log('pending');
  }

  const txProps: TrackerViewProps | undefined =
    pending && item?.sourceTxHash
      ? // @TODO: breaking rules of hook.. useTxTracker should prob not be a hook
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useTxTracker(
          item.sourceNetwork,
          item.sourceTxHash,
          item.timeStamp,
          getAvalancheProvider(network),
          getEthereumProvider(network),
          setTransactionDetails,
          config,
          addresses?.addrC,
          transactionDetails,
          bridgeAssets,
        )
      : undefined;

  useEffect(() => {
    if (txProps?.complete) {
      ShowSnackBar(`You have received ${txProps.amount} ${txProps.symbol}`);
      removeBridgeTransaction({...txProps}).then();
    }
  }, [txProps?.complete]);

  function openTransactionStatus() {
    navigation.navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
      blockchain: item.sourceNetwork,
      txHash: item.sourceTxHash,
      txTimestamp: item.createdAt
        ? Date.parse(item.createdAt.toString())
        : item.timestamp || item.timeStamp || Date.now().toString(),
    });
  }

  return (
    <AvaListItem.Base
      title={pending ? 'Bridging...' : 'Bridge'}
      leftComponent={
        <View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.colorStroke2 + Opacity10,
            },
          ]}>
          <BridgeSVG size={20} color={theme.colorPrimary1} />
          {pending && txProps && (
            <View style={{position: 'absolute'}}>
              <Spinner size={50} />
            </View>
          )}
        </View>
      }
      subtitle={
        fromAvalancheToEthereum
          ? 'Avalanche → Ethereum'
          : 'Ethereum → Avalanche'
      }
      rightComponent={
        pending ? (
          <View>
            <AvaText.ActivityTotal ellipsizeMode={'tail'}>
              ${item.amount.toString()} {item.symbol}
            </AvaText.ActivityTotal>
            {txProps && (
              <AvaText.Heading3 textStyle={{marginEnd: 8}}>
                {txProps.confirmationCount > // to avoid showing 16/15 since confirmations keep going up
                txProps.requiredConfirmationCount
                  ? txProps.requiredConfirmationCount
                  : txProps.confirmationCount}
                /{txProps.requiredConfirmationCount}
              </AvaText.Heading3>
            )}
          </View>
        ) : (
          <AvaText.ActivityTotal ellipsizeMode={'tail'}>
            ${item.amountDisplayValue} {item.tokenSymbol}
          </AvaText.ActivityTotal>
        )
      }
      embedInCard
      onPress={() => {
        pending ? openTransactionStatus() : onPress();
      }}
    />
  );
};

const styles = StyleSheet.create({
  indicator: {
    paddingHorizontal: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BridgeTransactionItem;
