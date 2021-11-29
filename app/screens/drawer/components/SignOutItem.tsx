import React from 'react';
import {useNavigation} from '@react-navigation/native';
import AvaButton from 'components/AvaButton';
import {NativeStackNavigatorProps} from 'react-native-screens/lib/typescript/native-stack/types';
import AppNavigation from 'navigation/AppNavigation';

const SignOutItem = () => {
  const navigation = useNavigation<NativeStackNavigatorProps>();

  return (
    <AvaButton.TextLarge
      style={{
        alignItems: 'flex-start',
      }}
      onPress={() => navigation?.navigate(AppNavigation.Modal.SignOut)}>
      Sign out
    </AvaButton.TextLarge>
  );
};

export default SignOutItem;
