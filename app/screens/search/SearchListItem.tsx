import React, {FC} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import Switch from 'components/Switch';

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
  isShowingZeroBalanceForToken,
  onSwitchChanged,
}) => {
  const theme = useApplicationContext().theme;
  function handleChange(value: boolean) {
    onSwitchChanged(value);
  }

  const tokenLogo = (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
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
      disabled
    />
  );
};

export default SearchListItem;
