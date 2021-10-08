import React, {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import TabViewBackground from './components/TabViewBackground';
import SendTokenStackScreen from 'navigation/SendTokenStackScreen';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';

const SendReceiveBottomSheet: FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {goBack, canGoBack} = useNavigation();
  const snapPoints = useMemo(() => ['0%', '86%'], []);
  const theme = useContext(ApplicationContext).theme;

  useEffect(() => {
    // intentionally setting delay so animation is visible.
    setTimeout(() => {
      bottomSheetRef?.current?.snapTo(1);
    }, 50);
  }, []);

  const handleClose = useCallback(() => {
    bottomSheetRef?.current?.collapse();
    // InteractionManager.runAfterInteractions(() => canGoBack() && goBack());
  }, []);

  const handleChange = useCallback(index => {
    if (index === 0 && canGoBack()) {
      goBack();
    }
  }, []);

  const MyHandle = () => {
    return <Space y={24} />;
  };

  // renders
  return (
    <View style={[styles.container, {backgroundColor: theme.transparent}]}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        handleComponent={MyHandle}
        onChange={handleChange}
        backdropComponent={BottomSheetBackdrop}
        backgroundComponent={TabViewBackground}>
        <SendTokenStackScreen onClose={handleClose} />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});

export default SendReceiveBottomSheet;
