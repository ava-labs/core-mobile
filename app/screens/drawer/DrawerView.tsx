import React, {FC, useContext, useEffect, useRef, useState} from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaText from 'components/AvaText';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import CurrencyItem from 'screens/drawer/components/CurrencyItem';
import SecurityItem from 'screens/drawer/components/SecurityItem';
import LegalItem from 'screens/drawer/components/LegalItem';
import AdvancedItem from 'screens/drawer/components/AdvancedItem';
import Separator from 'components/Separator';
import VersionItem from 'screens/drawer/components/VersionItem';
import AppViewModel from 'AppViewModel';
import LightModeSVG from 'components/svg/LightModeSVG';
import DarkModeSVG from 'components/svg/DarkModeSVG';
import NetworkSelector from 'network/NetworkSelector';
import AvaButton from 'components/AvaButton';

const DrawerView: FC<DrawerContentComponentProps> = ({navigation}) => {
  const context = useContext(ApplicationContext);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [openNetworkSwitcher, setOpenNetworkSwitcher] = useState(false);

  useEffect(() => {
    bottomSheetRef?.current?.snapTo(openNetworkSwitcher ? 0 : 1);
  }, [openNetworkSwitcher]);

  function toggleDarkLightMode() {
    Alert.alert('Toggle dark/ligt mode');
  }

  function handleCloseDrawer() {
    navigation.closeDrawer();
  }

  const header = (
    <View style={styles.headerContainer}>
      <AvaLogoSVG size={32} />
      <AvaText.Heading1>Wallet</AvaText.Heading1>
      <Pressable
        style={styles.darkLightModeContainer}
        onPress={toggleDarkLightMode}>
        {context.isDarkMode ? <LightModeSVG /> : <DarkModeSVG />}
      </Pressable>
    </View>
  );

  const networkSwitcher = (
    <NetworkSelector
      isExpanded={openNetworkSwitcher}
      toggleOpenClose={() => setOpenNetworkSwitcher(!openNetworkSwitcher)}
      closeDrawer={handleCloseDrawer}
    />
  );

  const renderContent = () => (
    <>
      <BottomSheetScrollView
        style={{backgroundColor: context.theme.bgOnBgApp, flex: 1}}>
        <CurrencyItem navigation={navigation} />
        <SecurityItem navigation={navigation} />
        <LegalItem />
        <AdvancedItem />
      </BottomSheetScrollView>
      <Separator />
      <VersionItem />

      <AvaButton.TextLarge
        style={{
          alignItems: 'flex-start',
        }}
        onPress={() => AppViewModel.onLogout()}>
        Sign out
      </AvaButton.TextLarge>
    </>
  );

  /**
   * Controls the background for where the handle is.
   * Here we use it to match our content background color.
   */
  const bottomSheetBackgroundComponent = () => (
    <View
      style={[
        styles.contentContainer,
        {backgroundColor: context.theme.bgOnBgApp},
      ]}
    />
  );

  /**
   * Allows customization of the handle. In this case we don't want to show one.
   */
  const bottomSheetHandleComponent = () => (
    <View style={styles.closeLineContainer} />
  );

  return (
    <View style={[styles.container, {backgroundColor: context.theme.bgApp}]}>
      {header}
      {networkSwitcher}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['65%', '83%']}
        index={1}
        backgroundComponent={bottomSheetBackgroundComponent}
        handleComponent={bottomSheetHandleComponent}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}>
        {renderContent()}
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  closeLineContainer: {
    alignSelf: 'center',
    height: 20,
  },
  closeLine: {
    width: 40,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
  },
  darkLightModeContainer: {flex: 1, alignItems: 'flex-end'},
});

export default DrawerView;
