import React from 'react';
import {useSelectedAccountContext} from 'contexts/SelectedAccountContext';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import AvaButton from 'components/AvaButton';
import {StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';

export default function HeaderAccountSelector() {
  const {selectedAccount} = useSelectedAccountContext();
  const theme = useApplicationContext().theme;
  const navigation = useNavigation();

  function onAccountPressed() {
    navigation.navigate(AppNavigation.Modal.AccountBottomSheet);
  }

  return (
    <AvaButton.Base onPress={onAccountPressed}>
      <View style={[styles.accountTitleContainer]}>
        <AvaText.Heading3 ellipsize={'middle'} textStyle={{marginRight: 16}}>
          {selectedAccount?.title}
        </AvaText.Heading3>
        <View style={{transform: [{rotate: '90deg'}]}}>
          <CarrotSVG color={theme.txtListItem} />
        </View>
      </View>
    </AvaButton.Base>
  );
}

const styles = StyleSheet.create({
  accountTitleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
});
