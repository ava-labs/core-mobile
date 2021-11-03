import React, {useContext, useEffect, useState} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  View,
} from 'react-native';
import ChainCard from './ChainCard';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import CopySVG from 'components/svg/CopySVG';
import AvaText from 'components/AvaText';
import {Opacity05} from 'resources/Constants';
import {ShowSnackBar} from 'components/Snackbar';
import {ScrollView} from 'react-native-gesture-handler';
import Clipboard from '@react-native-clipboard/clipboard';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function ReceiveToken() {
  const {addressC, addressX} = usePortfolio();
  const {theme} = useApplicationContext();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    switch (currentSlide) {
      case 0:
        setSelectedAddress(addressC);
        break;
      case 1:
        setSelectedAddress(addressX);
        break;
    }
  }, [currentSlide, addressC, addressX]);

  const onShare = async (address: string) => {
    try {
      const result = await Share.share({
        message: address,
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('shared with activity type of ', result.activityType);
        } else {
          console.log('shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('dismissed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateCurrentPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!e) {
      return;
    }
    const {nativeEvent} = e;
    if (nativeEvent && nativeEvent.contentOffset) {
      let cs = 0;
      if (nativeEvent.contentOffset.x === 0) {
        setCurrentSlide(cs);
      } else {
        const approxCurrentSlide = nativeEvent.contentOffset.x / SCREEN_WIDTH;
        cs = Math.ceil(parseInt(approxCurrentSlide.toFixed(2), 10)) + 1;
        setCurrentSlide(cs);
      }
    }
  };

  return (
    <View style={{flex: 1, justifyContent: 'space-between'}}>
      <View style={{height: 320}}>
        <ScrollView
          horizontal
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={calculateCurrentPage}>
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
        </ScrollView>
      </View>
      <View style={{flex: 1}}>
        <ScrollView>
          <AvaButton.Base
            onPress={() => {
              Clipboard.setString(selectedAddress);
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
              {selectedAddress}
            </AvaText.Body1>
          </AvaButton.Base>
        </ScrollView>
      </View>

      <AvaButton.PrimaryLarge
        style={{marginHorizontal: 16, marginBottom: 16}}
        onPress={() => onShare(selectedAddress)}>
        Share
      </AvaButton.PrimaryLarge>
    </View>
  );
}

export default ReceiveToken;
