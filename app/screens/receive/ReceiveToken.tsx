import React from 'react';
import {Dimensions, View} from 'react-native';
import ChainCard from './ChainCard';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {usePortfolio} from 'screens/portfolio/usePortfolio';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function ReceiveToken() {
  //todo: not working right now. Investigate after dinner
  const {addressC, addressX} = usePortfolio();

  return (
    <View style={{flex: 1}}>
      <BottomSheetScrollView
        horizontal
        snapToInterval={SCREEN_WIDTH * 0.9}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        style={{paddingRight: 24}}>
        <ChainCard
          chainName={'C Chain'}
          description={'Some description about the C Chain'}
          address={addressC}
        />
        <ChainCard
          chainName={'X Chain'}
          description={'Some description about the X Chain'}
          address={addressX}
        />
      </BottomSheetScrollView>
    </View>
  );
}

export default ReceiveToken;
