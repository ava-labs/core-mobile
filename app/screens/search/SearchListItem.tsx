import React, {Dispatch, FC, useState} from 'react';
import {Image, Switch} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';

type Props = {
  balance?: string;
  name: string;
  image?: string;
  onPress?: () => void;
  onSwitchChanged: (value: boolean) => void;
  isShowingZeroBalanceForToken?: boolean;
};

const SearchListItem: FC<Props> = ({
  balance = 0,
  name,
  image,
  onPress,
  isShowingZeroBalanceForToken,
  onSwitchChanged,
}) => {

  function handleChange(value: boolean) {
    onSwitchChanged(value);
  }

  const rightComponent = () => {
    if (balance <= 0) {
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
      leftComponent={<Image source={{uri: image}} />}
      rightComponent={rightComponent()}
      onPress={onPress}
    />
  );
};

export default SearchListItem;
