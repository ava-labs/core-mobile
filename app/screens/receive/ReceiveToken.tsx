import React from 'react';
import {Dimensions, ScrollView, View} from 'react-native';
import ChainCard from './ChainCard';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function ReceiveToken() {
  //todo: not working right now. Investigate after dinner
  // const {addressC, addressX} = usePortfolio();
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
          address={'0x:fuji1hul6q0w383863v6kejul2psaeumcwee5fzzk2e'}
        />
        <ChainCard
          chainName={'X Chain'}
          description={'Some description about the X Chain'}
          address={'X:fuji1hul6q0w383863v6kejul2psaeumcwee5fzzk2e'}
        />
      </BottomSheetScrollView>
    </View>
  );
}

export default ReceiveToken;
