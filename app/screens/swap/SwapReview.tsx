import React, {FC, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import AvaListItem from 'components/AvaListItem';
import Avatar from 'components/Avatar';
import Separator from 'components/Separator';
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails';
import {useSwapContext} from 'contexts/SwapContext';
import AvaButton from 'components/AvaButton';
import {useNavigation} from '@react-navigation/native';
import Loader from 'components/Loader';

const SwapReview: FC = () => {
  const {swapTo, swapFrom, doSwap} = useSwapContext();
  const theme = useApplicationContext().theme;
  const {goBack} = useNavigation();
  const [loading, setLoading] = useState(false);

  function onConfirm() {
    setLoading(true);
    doSwap()
      .catch(reason => console.error(reason))
      .finally(() => setLoading(false));
  }

  return loading ? (
    <Loader />
  ) : (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Space y={8} />
        <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
          Review Order
        </AvaText.Heading1>
        <Space y={20} />
        <AvaText.Heading3 textStyle={{marginHorizontal: 16}}>
          From
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={<Avatar.Token token={swapFrom.token!} />}
          title={swapFrom.token?.symbol}
          rightComponent={
            <View>
              <AvaText.Body1>{swapFrom.amount}</AvaText.Body1>
              <AvaText.Body3>{swapFrom.usdValue}</AvaText.Body3>
            </View>
          }
        />
        <Space y={16} />
        <AvaText.Heading3 textStyle={{marginHorizontal: 16}}>
          To
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={<Avatar.Token token={swapTo.token!} />}
          title={swapTo.token?.symbol}
          rightComponent={
            <View>
              <AvaText.Body1>{swapTo.amount}</AvaText.Body1>
              <AvaText.Body3>{swapTo.usdValue}</AvaText.Body3>
            </View>
          }
        />
        <Separator style={{marginHorizontal: 16, marginVertical: 24}} />
        <SwapTransactionDetail review />
      </ScrollView>
      <AvaButton.PrimaryLarge
        onPress={onConfirm}
        style={{marginHorizontal: 16}}>
        Confirm
      </AvaButton.PrimaryLarge>
      <Space y={16} />
      <AvaButton.PrimaryLarge
        onPress={goBack}
        textColor={theme.colorText1}
        style={{
          marginHorizontal: 16,
          backgroundColor: theme.colorDisabled,
        }}>
        Cancel
      </AvaButton.PrimaryLarge>
      <Space y={8} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SwapReview;
