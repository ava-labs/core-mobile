import React, {FC, useContext, useEffect, useState} from 'react';
import {Pressable, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';

interface Props {
  toggleOpenClose: () => void;
  isExpanded: boolean;
}

const paddingTop = 24;
const marginEnd = 12;
const MAINNET_NAME = 'Avalanche Mainnet';
const FUJI_NAME = 'Avalanche FUJI';

const NetworkSelector: FC<Props> = ({toggleOpenClose, isExpanded}) => {
  const theme = useContext(ApplicationContext).theme;
  const networkContext = useNetworkContext();
  const [networkName, setNetworkName] = useState('');

  useEffect(() => {
    setNetworkName(networkContext?.network?.name ?? '');
  }, [networkContext?.network]);

  return (
    <View style={{backgroundColor: theme.bgApp}}>
      <Pressable
        style={{paddingTop: 16, paddingBottom: 20, flexDirection: 'row'}}
        onPress={toggleOpenClose}>
        <AvaText.Body2
          color={theme.txtListItem}
          textStyle={{marginEnd: marginEnd}}>
          {networkName}
        </AvaText.Body2>
        <CarrotSVG direction={isExpanded ? 'up' : 'down'} size={12} />
      </Pressable>
      <Pressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: paddingTop,
        }}
        onPress={() => networkContext?.setNetwork?.(MAINNET_NETWORK)}>
        <AvaText.Body2 color={theme.txtListItem}>
          {MAINNET_NETWORK.name}
        </AvaText.Body2>
        {networkName === MAINNET_NETWORK.name && <CheckmarkSVG />}
      </Pressable>
      <Pressable
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: paddingTop,
        }}
        onPress={() => networkContext?.setNetwork?.(FUJI_NETWORK)}>
        <AvaText.Body2 color={theme.txtListItem}>
          {FUJI_NETWORK.name}
        </AvaText.Body2>
        {networkName === FUJI_NETWORK.name && <CheckmarkSVG />}
      </Pressable>
      <AvaText.Body2
        color={theme.txtListItem}
        textStyle={{paddingTop: paddingTop}}>
        Add Network
      </AvaText.Body2>
    </View>
  );
};

export default NetworkSelector;
