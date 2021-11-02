import React, {FC, useContext, useMemo} from 'react';
import {Image, Platform, StyleSheet, Switch, View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  balance?: string;
  name: string;
  image?: string;
  symbol?: string;
  position: number;
  onPress?: () => void;
  onSwitchChanged: (value: boolean) => void;
  isShowingZeroBalanceForToken?: boolean;
};

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    width: 32,
    height: 32,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

const SearchListItem: FC<Props> = ({
  balance,
  name,
  image,
  onPress,
  symbol,
  position,
  isShowingZeroBalanceForToken,
  onSwitchChanged,
}) => {
  const theme = useApplicationContext().theme;
  function handleChange(value: boolean) {
    onSwitchChanged(value);
  }

  // waiting for UX to give the colors for Android.
  const thumbColorOn = useMemo(
    () => (Platform.OS === 'android' ? theme.white : theme.white),
    [],
  );
  const thumbColorOff = useMemo(
    () => (Platform.OS === 'android' ? theme.onBgSearch : theme.onBgSearch),
    [],
  );
  const trackColorOn = useMemo(
    () => (Platform.OS === 'android' ? theme.colorPrimary1 : theme.colorPrimary1),
    [],
  );
  const trackColorOff = useMemo(
    () => (Platform.OS === 'android' ? theme.colorBg2 : theme.background),
    [],
  );

  const tokenLogo = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <AvaText.Body2 textStyle={{marginRight: 16}}>{position}</AvaText.Body2>
      {symbol === 'AVAX' ? (
        <AvaLogoSVG
          size={32}
          logoColor={theme.white}
          backgroundColor={theme.logoColor}
        />
      ) : (
        <Image style={styles.tokenLogo} source={{uri: image}} />
      )}
    </View>
  );

  const rightComponent = () => {
    if (balance === undefined) {
      return (
        <Switch
          value={isShowingZeroBalanceForToken}
          onValueChange={handleChange}
          thumbColor={
            isShowingZeroBalanceForToken ? thumbColorOn : thumbColorOff
          }
          trackColor={{false: trackColorOff, true: trackColorOn}}
          ios_backgroundColor={trackColorOff}
        />
      );
    } else {
      return <AvaText.Body2>{balance}</AvaText.Body2>;
    }
  };

  return (
    <AvaListItem.Base
      title={name}
      leftComponent={tokenLogo}
      rightComponent={rightComponent()}
      onPress={onPress}
      listPressDisabled
    />
  );
};

export default SearchListItem;
