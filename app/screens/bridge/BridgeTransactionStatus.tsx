import React, {FC, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {RouteProp, useRoute} from '@react-navigation/native';
import {BridgeStackParamList} from 'navigation/wallet/BridgeScreenStack';
import AvaText from 'components/AvaText';
import {
  Blockchain,
  useBridgeConfig,
  useBridgeSDK,
  usePrice,
  useTokenInfoContext,
  useTxTracker,
} from '@avalabs/bridge-sdk';
import {
  ActiveNetwork,
  MAINNET_NETWORK,
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import DotSVG from 'components/svg/DotSVG';
import Avatar from 'components/Avatar';
import AvaListItem from 'components/AvaListItem';
import {Row} from 'components/Row';
import {Space} from 'components/Space';
import Separator from 'components/Separator';
import OvalTagBg from 'components/OvalTagBg';
import {displaySeconds} from 'utils/Utils';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import ConfirmationTracker from 'screens/bridge/ConfirmationTracker';
import BridgeConfirmations from 'components/BridgeConfirmations';

interface Props {}

function getEtherscanLink(network?: ActiveNetwork) {
  if (network?.name === MAINNET_NETWORK.name) {
    return 'https://etherscan.io';
  }

  return 'https://rinkeby.etherscan.io';
}

const BridgeTransactionStatus: FC<Props> = props => {
  const {theme} = useApplicationContext();
  const {params} = useRoute<RouteProp<BridgeStackParamList>>();
  const {selectedCurrency} = useApplicationContext().appHook;

  const tokenInfoData = useTokenInfoContext();

  const {addresses} = useWalletStateContext();
  const {
    currentAsset,
    transactionDetails,
    bridgeAssets,
    setTransactionDetails,
  } = useBridgeSDK();
  const {config} = useBridgeConfig();
  const [fromCardOpen, setFromCardOpen] = useState<boolean>(false);
  // const [toastShown, setToastShown] = useState<boolean>(
  //   location.search.includes('complete=true'),
  // );
  const {network} = useNetworkContext();
  const etherscanLink = getEtherscanLink(network);
  const ethereumProvider = getEthereumProvider(network);
  const avalancheProvider = getAvalancheProvider(network);
  const txProps = useTxTracker(
    params?.blockchain as Blockchain,
    params?.txHash ?? '',
    params?.txTimestamp ?? '',
    avalancheProvider,
    ethereumProvider,
    setTransactionDetails,
    config,
    addresses?.addrC,
    transactionDetails,
    bridgeAssets,
  );

  const assetPrice = usePrice(txProps?.symbol || currentAsset);

  const tokenLogo = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 100,
        zIndex: 1000,
      }}>
      <View style={{position: 'absolute'}}>
        <DotSVG fillColor={theme.colorBg1} size={72} />
      </View>
      <Avatar.Custom
        name={transactionDetails?.tokenSymbol ?? ''}
        symbol={tokenInfoData?.[transactionDetails?.tokenSymbol ?? 0]?.logo}
        size={60}
      />
    </View>
  );

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          marginTop: 30,
          paddingTop: 30,
          marginHorizontal: 16,
          borderRadius: 10,
        }}>
        {tokenLogo}
        {txProps && (
          <View>
            <AvaListItem.Base
              title={'Sending amount'}
              titleAlignment={'flex-start'}
              rightComponentHorizontalAlignment={'flex-end'}
              rightComponent={
                <View style={{alignItems: 'flex-end'}}>
                  <Row>
                    <AvaText.Heading3>
                      {txProps?.amount?.toNumber()}
                    </AvaText.Heading3>
                    <AvaText.Heading3 color={theme.colorText3}>
                      {txProps?.symbol}
                    </AvaText.Heading3>
                  </Row>
                  <AvaText.Body3 currency color={theme.colorText1}>
                    {assetPrice.mul(txProps?.amount ?? 0).toNumber()}
                  </AvaText.Body3>
                </View>
              }
            />
          </View>
        )}
      </View>
      <Space y={16} />
      <View
        style={{
          minHeight: 200,
          backgroundColor: theme.colorBg2,
          marginHorizontal: 16,
          paddingBottom: 8,
          borderRadius: 10,
        }}>
        <AvaListItem.Base
          title={'From'}
          rightComponent={
            <AvaText.Heading3>
              {params?.blockchain === Blockchain.AVALANCHE
                ? 'Avalanche'
                : 'Ethereum'}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <AvaListItem.Base
          title={'Network Fee'}
          rightComponent={
            <View style={{alignItems: 'flex-end'}}>
              <Row>
                <AvaText.Heading3>
                  {txProps.gasCost?.toNumber().toFixed(9)} {txProps.symbol}
                </AvaText.Heading3>
              </Row>
              <AvaText.Body3 currency color={theme.colorText1}>
                ~{txProps.gasValue?.toNumber().toFixed(2)} USD
              </AvaText.Body3>
            </View>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <BridgeConfirmations txProps={txProps} />
      </View>
      <Space y={16} />
      <View
        style={{
          backgroundColor: theme.colorBg2,
          marginHorizontal: 16,
          borderRadius: 10,
        }}>
        <AvaListItem.Base
          title={'To'}
          rightComponent={
            <AvaText.Heading3>
              {params?.blockchain === Blockchain.AVALANCHE
                ? 'Ethereum'
                : 'Avalanche'}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <AvaListItem.Base
          title={'Confirmations'}
          rightComponent={
            <Row style={{alignItems: 'center'}}>
              <AvaText.Heading3 textStyle={{marginEnd: 8}}>
                {txProps.complete ? '1' : '0'}/
                {
                  1 // On the destination network, we just need 1 confirmation
                }
              </AvaText.Heading3>
              <OvalTagBg
                color={txProps.complete ? theme.colorSuccess : theme.colorBg3}>
                <AvaText.ButtonSmall>
                  {displaySeconds(txProps.targetSeconds)}
                  {txProps.complete && (
                    <>
                      {' '}
                      <CheckmarkSVG color={theme.white} size={10} />
                    </>
                  )}
                </AvaText.ButtonSmall>
              </OvalTagBg>
            </Row>
          }
        />
        <ConfirmationTracker
          started={txProps.targetSeconds > 0}
          requiredCount={
            1 // On avalanche, we just need 1 confirmation
          }
          currentCount={txProps.complete ? 1 : 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 25,
  },
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
  explorerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 48,
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#FFFFFF26',
  },
});

export default BridgeTransactionStatus;
