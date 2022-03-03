import React, {FC, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import AvaListItem from 'components/AvaListItem';
import DropDown from 'components/Dropdown';
import {Row} from 'components/Row';
import Separator from 'components/Separator';
import Avatar from 'components/Avatar';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  formatTokenAmount,
  useAssets,
  useBridgeSDK,
  useMaxTransferAmount,
  usePrice,
  useSwitchFromUnavailableAsset,
  useTokenInfoContext,
  useTransactionFee,
} from '@avalabs/bridge-sdk';
import {Big} from '@avalabs/avalanche-wallet-sdk';
import {useLoadTokenBalance} from 'screens/bridge/hooks/useLoadTokenBalance';
import AppNavigation from 'navigation/AppNavigation';
import {
  useNetworkContext,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import CarrotSVG from 'components/svg/CarrotSVG';
import InputText from 'components/InputText';
import {getAvalancheProvider} from 'screens/bridge/utils/getAvalancheProvider';
import {getEthereumProvider} from 'screens/bridge/utils/getEthereumProvider';
import {useGetTokenSymbolOnNetwork} from 'screens/bridge/hooks/useGetTokenSymbolOnNetwork';
import {useTransferAsset} from 'screens/bridge/hooks/useTransferAsset';
import {BridgeStackParamList} from 'navigation/wallet/BridgeScreenStack';
import FlexSpacer from 'components/FlexSpacer';
import TokenSelectAndAmount from 'components/TokenSelectAndAmount';
import {useAssetBalances} from 'screens/bridge/hooks/useAssetsWithBalances';

const formatBalance = (balance: Big | undefined) => {
  return balance && formatTokenAmount(balance, 6);
};

const Bridge: FC = () => {
  useSwitchFromUnavailableAsset(true);
  const theme = useApplicationContext().theme;
  const {selectedCurrency} = useApplicationContext().appHook;
  const network = useNetworkContext()?.network;
  const navigation = useNavigation<StackNavigationProp<BridgeStackParamList>>();
  const {getTokenSymbolOnNetwork} = useGetTokenSymbolOnNetwork();
  // const {error} = useBridgeConfig();
  const {
    currentAsset,
    setCurrentAsset,
    currentBlockchain,
    setCurrentBlockchain,
    setTransactionDetails,
  } = useBridgeSDK();

  const assetPrice = usePrice(currentAsset, selectedCurrency?.toLowerCase());
  const [amount, setAmount] = useState<Big>(new Big(0));
  const [amountTooLowError, setAmountTooLowError] = useState<string>('');
  const [bridgeError, setBridgeError] = useState<string>();
  const [pending, setPending] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const assets = useAssets(currentBlockchain);
  const tokenInfoContext = useTokenInfoContext();
  const assetInfo = assets[currentAsset || ''];
  const transferCost = useTransactionFee(currentBlockchain);
  const minimumTransferAmount = transferCost ? transferCost.mul(3) : BIG_ZERO;
  const tooLowAmount =
    !!transferCost && amount.gt(0) && amount.lt(minimumTransferAmount);
  const txFee = useTransactionFee(currentBlockchain);
  const {addresses} = useWalletStateContext();
  const blockchainTokenSymbol = getTokenSymbolOnNetwork(
    currentAsset ?? '',
    currentBlockchain,
  );

  const {
    transferAsset,
    status: wrapStatus,
    txHash,
  } = useTransferAsset(assetInfo);

  const targetBlockchain =
    currentBlockchain === Blockchain.AVALANCHE
      ? Blockchain.ETHEREUM
      : Blockchain.AVALANCHE;

  const sourceBalance = useLoadTokenBalance(currentBlockchain, assetInfo);
  const provider =
    currentBlockchain === Blockchain.AVALANCHE
      ? getAvalancheProvider(network)
      : getEthereumProvider(network);

  const maxTransferAmount = useMaxTransferAmount(
    sourceBalance.balance,
    addresses?.addrC,
    provider,
  );

  /**
   * Used to display currently selected and dropdown items.
   * When used to render current item, showCheckmarks is false
   * When used to render dropdown items, showCheckmark is true
   * currently selected
   * @param blockchain
   * @param showCheckmark
   */
  function dropdownItemFormat(blockchain: string, showCheckmark = true) {
    const isSelected = showCheckmark && currentBlockchain === blockchain;
    return (
      <Row
        style={{
          paddingVertical: 8,
          paddingHorizontal: 8,
          alignItems: 'center',
        }}>
        {blockchain === Blockchain.AVALANCHE ? (
          <Avatar.Custom name={'Avalanche'} symbol={'AVAX'} />
        ) : (
          <Avatar.Custom
            name={'Ethereum'}
            logoUri={
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
            }
          />
        )}
        <Space x={8} />
        <AvaText.Body1>{blockchain.toUpperCase()}</AvaText.Body1>
        {isSelected && (
          <>
            <Space x={8} />
            <CheckmarkSVG color={'white'} />
          </>
        )}
      </Row>
    );
  }

  /**
   * Method used to render custom dropdown item
   * @param item
   */
  const renderDropdownOptions = (item: ListRenderItemInfo<string>) => {
    return dropdownItemFormat(item.item);
  };

  /**
   * Blockchain array that's fed to dropdown
   */
  const blockChainItems = useMemo(() => {
    return [Blockchain.AVALANCHE, Blockchain.ETHEREUM];
  }, []);

  const handleAmountChanged = (value: string) => {
    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    // const [, endValue] = splitBN(value);
    // if (!endValue || endValue.length <= asset.denomination) {
    //   const valueToBn = getAmountBN(value, asset.denomination);
    //   // if (!valueToBn.eq(getAmountBN(amountStr, asset.denomination))) {
    //   //   onChange?.({
    //   //     // used to removing leading & trailing zeros
    //   //     amount: value ? new Big(value).toString() : '0',
    //   //     bn: valueToBn,
    //   //   });
    //   // }
    //   setAmountStr(value);
    //   setAmount(bnToBig(valueToBn, asset.denomination));
    // }
    setAmount(new Big(value || 0));
  };

  const handleSelect = (symbol: string) => {
    console.log('Selected Asset: ' + symbol);
    setCurrentAsset(symbol);
  };

  /**
   * Handles transfer transaction
   */
  const handleTransfer = async () => {
    if (BIG_ZERO.eq(amount)) {
      return;
    }

    try {
      setPending(true);
      const result = await transferAsset(amount);

      if (!result?.hash) {
        return;
      }

      setTransactionDetails({
        tokenSymbol:
          assetInfo.assetType === AssetType.NATIVE
            ? assetInfo.wrappedAssetSymbol
            : currentAsset || '',
        amount,
      });

      // Navigate to transaction status page
      navigation.navigate(AppNavigation.Bridge.BridgeTransactionStatus, {
        blockchain: currentBlockchain as string,
        txHash: result.hash,
        txTimestamp: Date.now().toString(),
      });
    } catch (e) {
      // user declined transaction
      console.error(e);
      return;
    } finally {
      setPending(false);
    }
  };

  /**
   * Amount too low check
   */
  useEffect(() => {
    if (tooLowAmount) {
      setAmountTooLowError(
        `Amount too low -- minimum is ${minimumTransferAmount.toFixed(9)}`,
      );
    } else {
      setAmountTooLowError('');
    }
  }, [tooLowAmount, minimumTransferAmount]);

  const transferDisabled =
    !sourceBalance.balance ||
    (sourceBalance.balance && amount.gt(sourceBalance.balance)) ||
    (bridgeError && bridgeError.length > 0) ||
    amountTooLowError.length > 0 ||
    pending ||
    tooLowAmount ||
    BIG_ZERO.eq(amount);

  const calculateEstimatedTotal = () => {
    if (!transferCost) {
      return;
    }

    const amountMinusTransfer = amount.minus(transferCost);
    return `${assetPrice.mul(amountMinusTransfer).toNumber()}`;
  };

  console.log('Asset Price: ' + assetPrice.toNumber());
  console.log('Amount: ' + amount.toNumber());

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Space y={20} />
        <View style={{backgroundColor: theme.colorBg2, borderRadius: 10}}>
          <AvaListItem.Base
            title={'From'}
            rightComponent={
              <DropDown
                style={{marginRight: 19}}
                filterItems={blockChainItems}
                currentItem={dropdownItemFormat(currentBlockchain, false)}
                onItemSelected={setCurrentBlockchain}
                customRenderItem={renderDropdownOptions}
                minWidth={180}
              />
            }
          />
          <Separator inset={16} />
          <View
            style={{
              flex: 1,
              paddingStart: 16,
              paddingTop: 16,
              paddingBottom: 16,
            }}>
            <AvaText.Body3
              color={theme.colorText2}
              textStyle={{
                alignSelf: 'flex-end',
                paddingEnd: 16,
              }}>
              Balance: {formatBalance(sourceBalance?.balance)}{' '}
              {blockchainTokenSymbol}
            </AvaText.Body3>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Pressable
                onPress={() => {
                  navigation.navigate(AppNavigation.Modal.BridgeSelectToken, {
                    onTokenSelected: handleSelect,
                  });
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Avatar.Custom
                    name={blockchainTokenSymbol}
                    symbol={blockchainTokenSymbol}
                    logoUri={tokenInfoContext?.[blockchainTokenSymbol]?.logo}
                  />
                  <AvaText.Body1
                    textStyle={{
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {blockchainTokenSymbol} <CarrotSVG direction={'down'} />{' '}
                  </AvaText.Body1>
                </View>
              </Pressable>
              <InputText
                width={160}
                mode={'amount'}
                keyboardType="numeric"
                onMax={() => {
                  if (maxTransferAmount) {
                    setAmount(maxTransferAmount);
                  }
                }}
                onChangeText={handleAmountChanged}
                text={amount.toString()}
              />
            </View>
            {!amount.eq(BIG_ZERO) && (
              <AvaText.Body3
                currency
                color={theme.colorText2}
                textStyle={{
                  alignSelf: 'flex-end',
                  paddingEnd: 16,
                }}>
                {assetPrice.mul(amount).toNumber()}
              </AvaText.Body3>
            )}
          </View>
        </View>
        {!!bridgeError ||
          (!!amountTooLowError && (
            <AvaText.Body3
              textStyle={{marginVertical: 4}}
              color={theme.colorError}>
              {bridgeError || amountTooLowError}
            </AvaText.Body3>
          ))}
        <AvaButton.Base
          onPress={() => {
            setCurrentBlockchain(
              currentBlockchain === Blockchain.AVALANCHE
                ? Blockchain.ETHEREUM
                : Blockchain.AVALANCHE,
            );
          }}
          style={{
            alignSelf: 'flex-end',
            borderRadius: 50,
            backgroundColor: theme.listItemBg,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 16,
            marginVertical: 16,
          }}>
          <SwapNarrowSVG />
        </AvaButton.Base>
        <View style={{backgroundColor: theme.colorBg2, borderRadius: 10}}>
          <AvaListItem.Base
            title={'To'}
            rightComponent={
              <DropDown
                style={{marginRight: 19}}
                filterItems={blockChainItems}
                currentItem={dropdownItemFormat(targetBlockchain, false)}
                onItemSelected={setCurrentBlockchain}
                customRenderItem={renderDropdownOptions}
                minWidth={180}
              />
            }
          />
          <Separator inset={16} />
          <View
            style={{
              flex: 1,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <View>
              <AvaText.ButtonLarge>Receive</AvaText.ButtonLarge>
              <AvaText.Body3
                color={theme.colorText2}
                textStyle={{marginTop: 8}}>
                Estimated (minus transfer fees)
              </AvaText.Body3>
              <AvaText.Body3
                color={theme.colorText2}
                textStyle={{marginTop: 8}}>
                Estimated transfer fee
              </AvaText.Body3>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              {/* receive amount */}
              <AvaText.Body1>
                {txFee && amount && !BIG_ZERO.eq(amount)
                  ? `${amount.minus(txFee).toNumber().toFixed(9)} `
                  : '- '}
                <AvaText.Body1 color={theme.colorText2}>
                  {currentAsset}
                </AvaText.Body1>
              </AvaText.Body1>
              {/* estimate amount */}
              <AvaText.Body3
                currency
                textStyle={{marginTop: 8}}
                color={theme.colorText2}>
                {transferCost && amount && !BIG_ZERO.eq(amount)
                  ? calculateEstimatedTotal()
                  : 0}
              </AvaText.Body3>
              <AvaText.Body3
                textStyle={{marginTop: 8}}
                color={theme.colorText2}>
                ~{transferCost ? formatTokenAmount(transferCost, 6) : '-'}{' '}
                {currentAsset}
              </AvaText.Body3>
            </View>
          </View>
        </View>
        <Space y={80} />
        <Pressable
          style={{
            margin: 16,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'white',
            marginHorizontal: 16,
            paddingVertical: 12,
            // bottom: 40,
            opacity: transferDisabled ? 0.5 : 1,
          }}
          onPress={() => {
            console.log('transfer pressed');
            handleTransfer();
          }}
          disabled={transferDisabled}>
          <Row>
            {pending && (
              <>
                <Space x={8} />
                <ActivityIndicator color={theme.colorPrimary1} />
              </>
            )}
            <AvaText.ButtonLarge textStyle={{color: 'black'}}>
              Transfer
            </AvaText.ButtonLarge>
          </Row>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default Bridge;
