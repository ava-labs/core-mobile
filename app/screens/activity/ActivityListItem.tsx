import React, {FC, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import MovementIndicator from 'components/MovementIndicator';

type Props = {
  balance: number;
  movement?: number;
  tokenName: string;
  tokenPrice: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
};

const ActivityListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  symbol,
  balance,
  movement,
  onPress,
}) => {
  const theme = useContext(ApplicationContext).theme;
  const rightComponent = (
    <View style={{alignItems: 'flex-end'}}>
      <Text style={[styles.tokenNativeValue, {color: theme.txtListItem}]}>
        {`${tokenPrice} ${symbol?.toUpperCase()}`}
      </Text>
      <Text style={[styles.tokenUsdValue, {color: theme.txtListItemSubscript}]}>
        {`${tokenPrice} USD`}
      </Text>
    </View>
  );

  return (
    <>
      <AvaListItem.Base
        title={tokenName}
        subtitle={`Bal: ${balance}`}
        leftComponent={<MovementIndicator metric={movement} />}
        rightComponent={rightComponent}
        onPress={onPress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  tokenNativeValue: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 24,
  },
  tokenUsdValue: {
    fontSize: 14,
    lineHeight: 17,
  },
});

export default ActivityListItem;
