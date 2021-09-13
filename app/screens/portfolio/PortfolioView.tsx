import React, {useContext, useMemo, useRef, useState} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet, View} from 'react-native';
import AvaListItem from 'screens/portfolio/AvaListItem';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import SendAvaxC from '../sendAvax/SendAvaxC';
import {useWalletContext} from '@avalabs/wallet-react-components';
import {MnemonicWallet} from '@avalabs/avalanche-wallet-sdk';
import SendView from '../sendAvax/SendView';
import AvaBottomSheet from 'components/AvaBottomSheet';
import {useNavigation} from '@react-navigation/native';

type PortfolioProps = {
  onExit: () => void;
  onSwitchWallet: () => void;
};

const data: JSON[] = require('assets/coins.json');
export const keyExtractor = (item: any, index: number) => item?.id ?? index;

function PortfolioView({onExit, onSwitchWallet}: PortfolioProps) {
  const listRef = useRef<FlatList>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '25%', '50%', '90%'], []);
  const context = useContext(ApplicationContext);
  const navigation = useNavigation();
  const walletContext = useWalletContext();
  const [showSheet, setShowSheet] = useState(false);

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const json = item.item;
    return (
      <AvaListItem.Token
        tokenName={json.name}
        tokenPrice={json.current_price}
        image={json.image}
        symbol={json.symbol}
        onPress={() => {
          navigation.navigate('BottomSheet');
        }}
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.flex}>
      <PortfolioHeader bottomRef={bottomSheetRef} />
      <FlatList
        ref={listRef}
        style={[
          {
            flex: 1,
            marginTop: 36,
          },
        ]}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
      />
      <BottomSheet ref={bottomSheetRef} snapPoints={['0%', '50%']}>
        <View style={{backgroundColor: 'yellow', flex: 1}} />
      </BottomSheet>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default PortfolioView;
