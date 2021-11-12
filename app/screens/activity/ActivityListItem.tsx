import React, {FC} from 'react';
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
  if (History.isHistoryBaseTx(historyItem)) {
    const token = historyItem as any;
    const baseRightComponent = (
      <AvaListItem.CurrencyAmount
        value={
          <AvaText.ActivityTotal>
            {token.amountDisplayValue}
          </AvaText.ActivityTotal>
        }
        currency={
          <AvaText.ActivityTotal>{token.asset.symbol}</AvaText.ActivityTotal>
        }
      />
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
    const evmRightComponent = hasInput ? (
      <AvaText.Body2>Contract call</AvaText.Body2>
    ) : (
      <AvaListItem.CurrencyAmount
        value={
          <AvaText.ActivityTotal ellipsize={'tail'}>
            {sign + token.amountDisplayValue}
          </AvaText.ActivityTotal>
        }
        currency={<AvaText.ActivityTotal> AVAX</AvaText.ActivityTotal>}
      />
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
      <AvaListItem.CurrencyAmount
        value={
          <AvaText.ActivityTotal ellipsize={'tail'}>
            {token.amountDisplayValue}
          </AvaText.ActivityTotal>
        }
        currency={<AvaText.ActivityTotal> AVAX</AvaText.ActivityTotal>}
      />
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
      <AvaListItem.CurrencyAmount
        value={
          <AvaText.ActivityTotal ellipsize={'tail'}>
            {sign + token.amountDisplayValue}
          </AvaText.ActivityTotal>
        }
        currency={<AvaText.ActivityTotal> AVAX</AvaText.ActivityTotal>}
      />
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

export default ActivityListItem;
