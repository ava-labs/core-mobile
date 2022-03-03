import React, {FC, useEffect, useMemo, useState} from 'react';
import {ListRenderItemInfo, ScrollView, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import AvaButton from 'components/AvaButton';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {SwapStackParamList} from 'navigation/wallet/SwapScreenStack';
import AppNavigation from 'navigation/AppNavigation';
import AvaListItem from 'components/AvaListItem';
import DropDown from 'components/Dropdown';
import {Row} from 'components/Row';
import Separator from 'components/Separator';
import TokenSelectAndAmount from 'components/TokenSelectAndAmount';
import Avatar from 'components/Avatar';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import {
  AssetType,
  BIG_ZERO,
  Blockchain,
  formatTokenAmount,
  usdFormatter,
  useAssets,
  useBridgeConfig,
  useBridgeSDK,
  useTokenInfoContext,
  useTransactionFee,
  useUSDPrice,
  WrapStatus,
} from '@avalabs/bridge-sdk';
import {Big, bigToBN, BN, bnToBig} from '@avalabs/avalanche-wallet-sdk';
import {useAssetBalances} from 'screens/bridge/useAssetBalances';
import {useAssetBalance} from 'screens/bridge/useAssetBalance';
import {getAmountBN} from 'components/BNInput';

function splitBN(val: string) {
  return val.includes('.') ? val.split('.') : [val, null];
}

const formatBalance = (balance: Big | undefined) => {
  return balance && formatTokenAmount(balance, 6);
};

const Bridge: FC = () => {
  const theme = useApplicationContext().theme;
  const networkContext = useNetworkContext();
  const navigation = useNavigation<StackNavigationProp<SwapStackParamList>>();
  const {error} = useBridgeConfig();
  const {
    currentAsset,
    setCurrentAsset,
    currentBlockchain,
    setCurrentBlockchain,
    setTransactionDetails,
  } = useBridgeSDK();
  const {assetsWithBalances, loading} = useAssetBalances();
  const assetPrice = useUSDPrice(currentAsset);
  const [amount, setAmount] = useState<Big>(BIG_ZERO);
  const [amountTooLowError, setAmountTooLowError] = useState<string>('');
  const [bridgeError, setBridgeError] = useState<string>('');
  const [pending, setPending] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [wrapStatus, setWrapStatus] = useState<WrapStatus>(WrapStatus.INITIAL);
  const [txHash, setTxHash] = useState<string>();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const assets = useAssets(currentBlockchain);
  const tokenInfoData = useTokenInfoContext();
  const asset = assets[currentAsset || ''];
  const [maxValue, setMaxValue] = useState<BN>(new BN(0));
  const sourceBalance = useAssetBalance(currentAsset, currentBlockchain);
  const transferCost = useTransactionFee(currentBlockchain);
  const minimumTransferAmount = transferCost ? transferCost.mul(3) : BIG_ZERO;
  const tooLowAmount =
    !!transferCost && amount.gt(0) && amount.lt(minimumTransferAmount);
  const txFee = useTransactionFee(currentBlockchain);
  const [amountStr, setAmountStr] = useState('');

  const destinationBlockchain =
    currentBlockchain === Blockchain.AVALANCHE
      ? Blockchain.ETHEREUM
      : Blockchain.AVALANCHE;

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
            name={'Etherium'}
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
    const [, endValue] = splitBN(value);
    if (!endValue || endValue.length <= asset.denomination) {
      const valueToBn = getAmountBN(value, asset.denomination);
      // if (!valueToBn.eq(getAmountBN(amountStr, asset.denomination))) {
      //   onChange?.({
      //     // used to removing leading & trailing zeros
      //     amount: value ? new Big(value).toString() : '0',
      //     bn: valueToBn,
      //   });
      // }
      setAmountStr(value);
      setAmount(bnToBig(valueToBn, asset.denomination));
    }
  };

  const handleSelect = (symbol: string) => {
    setCurrentAsset(symbol);
  };

  /**
   * Handles transfer transaction
   */
  const handleTransfer = async () => {
    // if (BIG_ZERO.eq(amount)) {
    //   return;
    // }
    //
    // setPending(true);
    // const result: any = await transferAsset(
    //   amount,
    //   asset,
    //   setWrapStatus,
    //   setTxHash,
    // );
    // setPending(false);
    //
    // const timestamp = Date.now();
    //
    // setTransactionDetails({
    //   tokenSymbol:
    //     asset.assetType === AssetType.NATIVE
    //       ? asset.wrappedAssetSymbol
    //       : currentAsset || '',
    //   amount,
    // });
    //
    // // Navigate to transaction status page
    // navigation.navigate(AppNavigation.Swap.Review);
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

  useEffect(() => {
    setMaxValue(new BN(0));

    if (sourceBalance?.balance && transferCost) {
      if (BIG_ZERO.eq(sourceBalance.balance)) {
        return;
      }

      const balanceMinusFees = sourceBalance.balance?.minus(transferCost);

      setMaxValue(
        bigToBN(balanceMinusFees || BIG_ZERO, sourceBalance.asset.denomination),
      );
    }
  }, [transferCost, sourceBalance]);

  const transferDisabled =
    bridgeError.length > 0 ||
    amountTooLowError.length > 0 ||
    loading ||
    pending ||
    tooLowAmount ||
    BIG_ZERO.eq(amount);

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
              Balance {formatBalance(sourceBalance?.balance)}
            </AvaText.Body3>
            <TokenSelectAndAmount
              initAmount={'0.00'}
              onTokenSelect={token => handleSelect(token.symbol)}
              onAmountSet={handleAmountChanged}
              maxEnabled
              getMaxAmount={() => '741.23'}
              style={{paddingVertical: 0, paddingStart: 0, paddingEnd: 0}}
              inputWidth={146}
            />
            <AvaText.Body3
              color={theme.colorText2}
              textStyle={{
                alignSelf: 'flex-end',
                paddingEnd: 16,
              }}>
              $350.11 USD
            </AvaText.Body3>
          </View>
        </View>
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
                currentItem={dropdownItemFormat(destinationBlockchain, false)}
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
                Estimated
              </AvaText.Body3>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              {/* receive amount */}
              <AvaText.Body1>
                {txFee && amount && !BIG_ZERO.eq(amount)
                  ? `${amount
                      .minus(txFee)
                      .toNumber()
                      .toFixed(9)} ${currentAsset}`
                  : '-'}
                <AvaText.Body1 color={theme.colorText2}>ETH</AvaText.Body1>
              </AvaText.Body1>
              {/* estimate amount */}
              <AvaText.Body3
                textStyle={{marginTop: 8}}
                color={theme.colorText2}>
                {transferCost && amount && !BIG_ZERO.eq(amount) ? (
                  <>
                    ~
                    {usdFormatter.format(
                      assetPrice.mul(amount).minus(transferCost).toNumber(),
                    )}{' '}
                    USD
                  </>
                ) : (
                  '-'
                )}
              </AvaText.Body3>
            </View>
          </View>
        </View>
      </ScrollView>
      <AvaButton.Base
        style={{
          margin: 16,
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          marginHorizontal: 16,
          paddingVertical: 12,
          bottom: 40,
          opacity: transferDisabled && 0.5,
        }}
        onPress={handleTransfer}
        disabled={transferDisabled}>
        <AvaText.ButtonLarge textStyle={{color: 'black'}}>
          Transfer
        </AvaText.ButtonLarge>
      </AvaButton.Base>
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
