import React from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import CurrencyItem from 'screens/drawer/components/CurrencyItem';
import SecurityItem from 'screens/drawer/components/SecurityItem';
import LegalItem from 'screens/drawer/components/LegalItem';
import Separator from 'components/Separator';
import VersionItem from 'screens/drawer/components/VersionItem';
import LightModeSVG from 'components/svg/LightModeSVG';
import DarkModeSVG from 'components/svg/DarkModeSVG';
import {ScrollView} from 'react-native-gesture-handler';
import SignOutItem from 'screens/drawer/components/SignOutItem';
import SplashLogoSVG from 'components/svg/SplashLogoSVG';
import NetworkItem from 'screens/drawer/components/NetworkItem';
import {Space} from 'components/Space';

const DrawerView = () => {
  const context = useApplicationContext();

  function toggleDarkLightMode() {
    Alert.alert('Toggle dark/ligt mode');
  }

  const header = (
    <View style={styles.headerContainer}>
      <SplashLogoSVG />
      {/* hiding mode toggle until it's implemented */}
      {true || (
        <Pressable
          style={styles.darkLightModeContainer}
          onPress={toggleDarkLightMode}>
          {context.isDarkMode ? <LightModeSVG /> : <DarkModeSVG />}
        </Pressable>
      )}
    </View>
  );

  const renderContent = () => (
    <View
      style={{
        flex: 1,
      }}>
      <ScrollView>
        <Space y={48} />
        <NetworkItem />
        <CurrencyItem />
        <Separator style={{marginHorizontal: 16}} />
        <SecurityItem />
        <LegalItem />
        {/*<AdvancedItem />*/}
      </ScrollView>
      <Separator style={{marginHorizontal: 16}} />
      <VersionItem />
      <SignOutItem />
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: context.theme.colorBg2}]}>
      {header}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
  },
  darkLightModeContainer: {flex: 1, alignItems: 'flex-end'},
});

export default DrawerView;
