import React, {FC} from 'react';
import {Image, StyleSheet, View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import Switch from 'components/Switch';
import Avatar from 'components/Avatar';

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

const SearchListItem: FC<Props> = ({
  balance,
  name,
  image,
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
      <AvaText.Body2 textStyle={{marginRight: 16}}>{position}</AvaText.Body2>
      <Avatar.Custom name={name} symbol={symbol} logoUri={image} />
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
    />
  );
};

export default SearchListItem;
