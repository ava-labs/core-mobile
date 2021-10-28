import React, {useContext} from 'react';
import {View} from 'react-native';
import AvaButton from 'components/AvaButton';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';

type Props = {
  onBack: () => void;
};

export const ConfirmHeader = ({onBack}: Props) => {
  const {theme} = useContext(ApplicationContext);

  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}>
      <AvaButton.Icon onPress={onBack}>
        <CarrotSVG direction={'left'} color={theme.colorIcon1} />
      </AvaButton.Icon>
      <Space x={31} />
      <AvaText.Heading1>Confirm Transaction</AvaText.Heading1>
    </View>
  );
};
