import React, {useCallback, useContext, useState} from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AccountItem from 'screens/portfolio/account/AccountItem';
import {Account} from 'dto/Account';
import {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {useFocusEffect} from '@react-navigation/native';
import {SelectedAccountContext} from 'contexts/SelectedAccountContext';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function AccountView(): JSX.Element {
  const context = useContext(ApplicationContext);
  const {accounts, setSelectedAccount} = useContext(SelectedAccountContext);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  const onSelect = () => {
    setSelectedAccount(accounts[selectedAccountIndex]);
  };

  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageNumber = Math.min(
        Math.max(
          Math.floor(e.nativeEvent.contentOffset.x / SCREEN_WIDTH + 0.5),
          0,
        ),
        accounts.size,
      );
      setSelectedAccountIndex(pageNumber);
    },
    [accounts.size],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <View
        style={{
          flex: 1,
          backgroundColor: context.theme.colorBg2,
          paddingVertical: 16,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
          <AvaText.Heading1>My accounts</AvaText.Heading1>
          {/*<AddSVG />*/}
        </View>
        <Space y={16} />
        <BottomSheetScrollView
          focusHook={useFocusEffect}
          horizontal
          onMomentumScrollEnd={onScrollEnd}
          pagingEnabled
          showsHorizontalScrollIndicator={false}>
          {accountElements([...accounts.values()])}
        </BottomSheetScrollView>

        {/*<HeaderProgress*/}
        {/*  maxDots={accounts.length}*/}
        {/*  filledDots={selectedAccountIndex + 1}*/}
        {/*/>*/}
        {/*<AvaButton.PrimaryLarge style={{marginHorizontal: 16}} onPress={onSelect}>*/}
        {/*  Select*/}
        {/*</AvaButton.PrimaryLarge>*/}
      </View>
    </KeyboardAvoidingView>
  );
}

const accountElements = (accounts: Account[]): Element[] => {
  const elements: Element[] = [];

  accounts.forEach(account => {
    elements.push(
      <View key={account.title} style={{width: SCREEN_WIDTH, padding: 16}}>
        <AccountItem account={account} />
      </View>,
    );
  });
  return elements;
};

export default AccountView;
