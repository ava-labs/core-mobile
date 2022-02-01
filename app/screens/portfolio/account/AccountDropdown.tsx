import React, {useCallback, useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import HeaderAccountSelector from 'components/HeaderAccountSelector';
import {Account} from 'dto/Account';
import AccountItem from 'screens/portfolio/account/AccountItem';
import AvaText from 'components/AvaText';
import Separator from 'components/Separator';
import AvaButton from 'components/AvaButton';
import {useAccountsContext} from '@avalabs/wallet-react-components';
import {useNavigation} from '@react-navigation/native';
import {ShowSnackBar} from 'components/Snackbar';

function AccountDropdown({
  onAddEditAccounts,
}: {
  onAddEditAccounts: () => void;
}): JSX.Element {
  const {theme} = useApplicationContext();
  const {accounts, setActiveAccount} =
    useApplicationContext().repo.accountsRepo;
  const accountsContext = useAccountsContext();
  const {goBack} = useNavigation();
  const animScale = useRef(new Animated.Value(0)).current;
  const animTranslateY = useRef(new Animated.Value(-370)).current;

  useEffect(() => {
    Animated.timing(animScale, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.elastic(1),
    }).start();
  }, [animScale]);

  useEffect(() => {
    Animated.timing(animTranslateY, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.elastic(1.2),
    }).start();
  }, [animTranslateY]);

  const renderAccountItem = useCallback(
    (item: ListRenderItemInfo<Account>) => {
      const account = item.item;
      return (
        <AccountItem
          key={account.title}
          account={account}
          selected={account.active}
          onSelectAccount={accountIndex => {
            accountsContext.activateAccount(accountIndex);
            setActiveAccount(accountIndex);
          }}
        />
      );
    },
    [accountsContext, setActiveAccount],
  );

  return (
    <Pressable style={{flex: 1}} onPress={goBack}>
      <View
        style={{
          backgroundColor: theme.overlay,
          flex: 1,
          paddingHorizontal: 16,
        }}>
        <AvaButton.Base
          style={{paddingLeft: 12}}
          onPress={() => {
            ShowSnackBar('Copied');
            goBack();
          }}>
          <View
            style={{
              width: 180,
              alignSelf: 'center',
              backgroundColor: theme.colorBg1,
            }}>
            <HeaderAccountSelector
              direction={'up'}
              onPressed={() => goBack()}
            />
          </View>
        </AvaButton.Base>

        <Animated.View
          key="some key"
          style={{
            transform: [
              {
                translateY: animTranslateY,
              },
            ],
            height: 340,
            overflow: 'hidden',
            backgroundColor: theme.colorBg2,
            borderRadius: 12,
          }}>
          <FlatList
            data={[...accounts.values()]}
            renderItem={renderAccountItem}
          />
          <Separator />
          <AvaButton.Base onPress={onAddEditAccounts}>
            <AvaText.ButtonLarge
              textStyle={{
                marginHorizontal: 16,
                marginVertical: 12,
                color: theme.colorAccent,
              }}>
              Add/Edit Accounts
            </AvaText.ButtonLarge>
          </AvaButton.Base>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default AccountDropdown;
