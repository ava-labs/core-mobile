import React, {useContext} from 'react';
import {Dimensions, View} from 'react-native';
import ChainCard from './ChainCard';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import AvaText from 'components/AvaText';
import {Opacity05} from 'resources/Constants';
import {ShowSnackBar} from 'components/Snackbar';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function ReceiveToken() {
  //todo: not working right now. Investigate after dinner
  const {addressC, addressX} = usePortfolio();
  const {theme} = useContext(ApplicationContext);

  return (
    <View style={{flex: 1, justifyContent: 'space-between'}}>
      <View style={{height: 320}}>
        <BottomSheetScrollView
          horizontal
          snapToInterval={SCREEN_WIDTH * 0.9}
          snapToAlignment="center"
          showsHorizontalScrollIndicator={false}
          style={{
            paddingRight: 24,
          }}>
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
      <View style={{flex: 1}}>
        <BottomSheetScrollView>
          <AvaButton.Base
            onPress={() => {
              // Clipboard.setString(address ?? '');
              ShowSnackBar('Copied');
            }}
            style={[
              {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: theme.colorIcon1 + Opacity05,
                borderRadius: 8,
                marginVertical: 8,
                marginHorizontal: 16,
              },
            ]}>
            <CopySVG />
            <AvaText.Body1 textStyle={{flex: 1, marginLeft: 16}}>
              {'X-fuji1a49a78uvlrzl7gtyvlqhr5xywzay2s3txjtum4'}
            </AvaText.Body1>
          </AvaButton.Base>
        </BottomSheetScrollView>
      </View>

      <AvaButton.PrimaryLarge style={{marginHorizontal: 16, marginBottom: 16}}>
        Share
      </AvaButton.PrimaryLarge>
    </View>
  );
}

export default ReceiveToken;
