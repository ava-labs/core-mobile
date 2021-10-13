import React, {FC, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import {History} from '@avalabs/avalanche-wallet-sdk';
import {
  HistoryItemType,
  iHistoryEVMTx,
  iHistoryImportExport,
  iHistoryStaking,
} from '@avalabs/avalanche-wallet-sdk/dist/History';
import AvaText from 'components/AvaText';
import MovementIndicator from 'components/MovementIndicator';

type Props = {
  historyItem: HistoryItemType;
  onPress?: () => void;
};

const ActivityListItem: FC<Props> = ({historyItem, onPress}) => {
  const theme = useContext(ApplicationContext).theme;
  if (History.isHistoryBaseTx(historyItem)) {
    const token = historyItem as any;
    const baseRightComponent = (
      <View style={{alignItems: 'flex-end'}}>
        <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
          {token.amountDisplayValue} {token.asset.symbol}
        </Text>
      </View>
    );
    return (
      <AvaListItem.Base
        title={'AVM Tx'}
        rightComponent={baseRightComponent}
        embedInCard
        onPress={onPress}
      />
    );
  } else if (History.isHistoryEVMTx(historyItem)) {
    const token = historyItem as iHistoryEVMTx;
    const sign = token.isSender ? '-' : '+';
    const hasInput = !!token.input;
    const evmRightComponent = (
      <View style={{alignItems: 'flex-end'}}>
        {hasInput ? (
          <AvaText.Body2>Contract call</AvaText.Body2>
        ) : (
          <>
            <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
              {`${sign}${token.amountDisplayValue} AVAX`}
            </Text>
            {/*<AvaText.Body2>{`${token.amount} USD`}</AvaText.Body2>*/}
          </>
        )}
      </View>
    );
    return (
      <AvaListItem.Base
        title={'Avalanche'}
        leftComponent={<MovementIndicator metric={token.isSender ? -1 : 0} />}
        rightComponent={evmRightComponent}
        embedInCard
        onPress={onPress}
      />
    );
  } else if (History.isHistoryStakingTx(historyItem)) {
    const token = historyItem as iHistoryStaking;
    const stakingRightComponent = (
      <View style={{alignItems: 'flex-end'}}>
        <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
          {`${token.amountDisplayValue} AVAX`}
        </Text>
        {/*<Text*/}
        {/*  style={[styles.tokenUsdValue, {color: theme.txtListItemSubscript}]}>*/}
        {/*  {`${Utils.bnToLocaleString(token.amount, 2)} USD`}*/}
        {/*</Text>*/}
      </View>
    );
    return (
      <AvaListItem.Base
        title={'Staking'}
        rightComponent={stakingRightComponent}
        embedInCard
        onPress={onPress}
      />
    );
  } else if (History.isHistoryImportExportTx(historyItem)) {
    const token = historyItem as iHistoryImportExport;
    const sign = token.type === 'export' ? '-' : '+';
    const ImpExpRightComponent = (
      <View style={{alignItems: 'flex-end'}}>
        <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
          {`${sign}${token.amountDisplayValue} AVAX`}
        </Text>
        {/*<Text*/}
        {/*  style={[styles.tokenUsdValue, {color: theme.txtListItemSubscript}]}>*/}
        {/*  {`${Utils.bnToLocaleString(token.amount, 2)} USD`}*/}
        {/*</Text>*/}
      </View>
    );
    return (
      <AvaListItem.Base
        title={'Avalanche'}
        leftComponent={
          <MovementIndicator metric={token.type === 'export' ? -1 : 0} />
        }
        rightComponent={ImpExpRightComponent}
        embedInCard
        onPress={onPress}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  tokenNativeValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 24,
  },
  tokenUsdValue: {
    fontSize: 14,
    lineHeight: 17,
  },
});

export default ActivityListItem;
