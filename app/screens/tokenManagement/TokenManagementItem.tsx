import React, {FC} from 'react';
import {View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
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

const TokenManagementItem: FC<Props> = ({
  balance,
  name,
  image,
  symbol,
  isShowingZeroBalanceForToken,
  onSwitchChanged,
}) => {
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
      <Avatar.Custom name={name} symbol={symbol} logoUri={image} showBorder />
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

export default TokenManagementItem;
