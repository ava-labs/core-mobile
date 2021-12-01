import React from 'react';
import {Alert, Pressable, StyleSheet, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaText from 'components/AvaText';
import CurrencyItem from 'screens/drawer/components/CurrencyItem';
import SecurityItem from 'screens/drawer/components/SecurityItem';
import LegalItem from 'screens/drawer/components/LegalItem';
import Separator from 'components/Separator';
import VersionItem from 'screens/drawer/components/VersionItem';
import LightModeSVG from 'components/svg/LightModeSVG';
import DarkModeSVG from 'components/svg/DarkModeSVG';
import NetworkSelector from 'network/NetworkSelector';
import {ScrollView} from 'react-native-gesture-handler';
import SignOutItem from 'screens/drawer/components/SignOutItem';

const DrawerView = ({navigation}) => {
  const context = useApplicationContext();

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

  const networkSwitcher = <NetworkSelector closeDrawer={handleCloseDrawer} />;

  const renderContent = () => (
    <View
      style={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        flex: 1,
        backgroundColor: context.theme.colorBg2,
      }}>
      <ScrollView>
        <CurrencyItem />
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
    <View style={[styles.container, {backgroundColor: context.theme.colorBg1}]}>
      {header}
      {networkSwitcher}
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
    paddingTop: 24,
  },
  darkLightModeContainer: {flex: 1, alignItems: 'flex-end'},
});

export default DrawerView;
