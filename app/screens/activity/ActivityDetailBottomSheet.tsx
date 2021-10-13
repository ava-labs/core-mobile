import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {InteractionManager, Pressable, StyleSheet, View} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import ActivityDetailView from 'screens/activity/ActivityDetailView';
import {ApplicationContext} from 'contexts/ApplicationContext';
import TabViewBackground from 'screens/portfolio/components/TabViewBackground';

function ActivityDetailBottomSheet() {
  const {goBack} = useNavigation();
  const theme = useContext(ApplicationContext).theme;
  const route = useRoute();
  const bottomSheetModalRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['0%', '50%'], []);
  const txItem = route.params.historyItem;

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetModalRef?.current?.snapTo(1);
    }, 100);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetModalRef?.current?.close();
    InteractionManager.runAfterInteractions(() => goBack());
  }, []);

  const handleChange = useCallback(index => {
    // eslint-disable-next-line no-console
    console.log('handleSheetChange', index);
    index === 0 && handleClose();
  }, []);

  return (
    <>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
        ]}
        onPress={goBack}
      />
      <BottomSheet
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backgroundComponent={TabViewBackground}
        onChange={handleChange}>
        <ActivityDetailView txItem={txItem} />
      </BottomSheet>
    </>
  );
}
export default ActivityDetailBottomSheet;
