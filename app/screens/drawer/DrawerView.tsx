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
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationHelpers} from '@react-navigation/drawer/lib/typescript/src/types';
import SignOutItem from 'screens/drawer/components/SignOutItem';

const DrawerView = () => {
  const context = useApplicationContext();
  const {closeDrawer} = useNavigation<DrawerNavigationHelpers>();

  function toggleDarkLightMode() {
    Alert.alert('Toggle dark/ligt mode');
  }

  function handleCloseDrawer() {
    closeDrawer();
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

      <AvaButton.TextLarge
        style={{
          alignItems: 'flex-start',
        }}
        onPress={() => setLogoutWarningVisible(!logoutWarningVisible)}>
        Sign out
      </AvaButton.TextLarge>
      <Modal visible={logoutWarningVisible} transparent animated>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: 'rgba(0, 0, 0, 0.5)'},
          ]}
          onPress={() => setLogoutWarningVisible(!setLogoutWarningVisible)}
        />
        <View
          style={[
            {
              borderRadius: 8,
              backgroundColor: context.theme.colorBg2,
              paddingVertical: 24,
              paddingHorizontal: 16,
              marginHorizontal: 16,
              marginVertical: 16,
              justifyContent: 'flex-end',
              position: 'absolute',
              bottom: 0,
            },
          ]}>
          <AvaText.Heading2 textStyle={{textAlign: 'center'}}>
            Have you recorded your recovery phrase?
          </AvaText.Heading2>
          <AvaText.Body2 textStyle={{textAlign: 'center', marginVertical: 16}}>
            Without this you will not be able to sign back in to your account.
          </AvaText.Body2>
          <AvaButton.PrimaryLarge onPress={handleLogout}>
            Yes
          </AvaButton.PrimaryLarge>
          <Space y={8} />
          <AvaButton.TextLarge
            onPress={() => setLogoutWarningVisible(!logoutWarningVisible)}>
            No
          </AvaButton.TextLarge>
        </View>
      </Modal>
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
