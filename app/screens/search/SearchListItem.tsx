import React, {FC, useContext} from 'react';
import {Image, Switch} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  balance?: string;
  name: string;
  image?: string;
  onPress?: () => void;
  onSwitchChanged: (value: boolean) => void;
  isShowingZeroBalanceForToken?: boolean;
};

const SearchListItem: FC<Props> = ({
  balance,
  name,
  image,
  onPress,
  isShowingZeroBalanceForToken,
  onSwitchChanged,
}) => {
  const theme = useContext(ApplicationContext).theme;
  function handleChange(value: boolean) {
    onSwitchChanged(value);
  }

  const rightComponent = () => {
    if (balance === undefined) {
      return (
        <Switch
          value={isShowingZeroBalanceForToken}
          onValueChange={handleChange}
          trackColor={{true: theme.btnPrimaryBgPressed}}
          thumbColor={
            isShowingZeroBalanceForToken
              ? theme.colorPrimary1
              : theme.colorDisabled
          }
        />
      );
    } else {
      return <AvaText.Body2>{balance}</AvaText.Body2>;
    }
  };

  return (
    <AvaListItem.Base
      title={name}
      leftComponent={<Image source={{uri: image}} />}
      rightComponent={rightComponent()}
      onPress={onPress}
      listPressDisabled
    />
  );
};

export default SearchListItem;
