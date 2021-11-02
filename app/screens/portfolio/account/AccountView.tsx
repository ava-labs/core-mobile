import React, {useCallback, useState} from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AccountItem from 'screens/portfolio/account/AccountItem';
import {Account} from 'dto/Account';
import {useSelectedAccountContext} from 'contexts/SelectedAccountContext';
import {ScrollView} from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window')?.width;

function AccountView(): JSX.Element {
  const context = useApplicationContext();
  const {accounts, setSelectedAccount} = useSelectedAccountContext();
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
        <ScrollView
          horizontal
          onMomentumScrollEnd={onScrollEnd}
          pagingEnabled
          showsHorizontalScrollIndicator={false}>
          {accountElements([...accounts.values()])}
        </ScrollView>

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
