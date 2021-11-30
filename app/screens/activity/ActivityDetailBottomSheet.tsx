import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {InteractionManager} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import ActivityDetailView from 'screens/activity/ActivityDetailView';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';
import AvaxSheetHandle from 'components/AvaxSheetHandle';
import {PortfolioStackParamList} from 'navigation/wallet/PortfolioScreenStack';

type ActivityDetailRouteProps = RouteProp<PortfolioStackParamList>;

function ActivityDetailBottomSheet() {
  const {goBack} = useNavigation();
  const route = useRoute<ActivityDetailRouteProps>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '56%'], []);
  const txItem = route?.params?.historyItem;

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(1);

      if (!txItem) {
        // nothing to show
        handleClose();
      }
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef?.current?.close();
    InteractionManager.runAfterInteractions(() => goBack());
  }, []);

  const handleChange = useCallback(index => {
    index === 0 && handleClose();
  }, []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={BottomSheetBackdrop}
      backgroundComponent={TabViewBackground}
      handleComponent={AvaxSheetHandle}
      onChange={handleChange}>
      {txItem && <ActivityDetailView txItem={txItem} />}
    </BottomSheet>
  );
}

export default ActivityDetailBottomSheet;
