import React, {FC, useContext, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';
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
  closeDrawer: () => void;
}

const paddingTop = 24;
const marginEnd = 12;
const DOT = '\u25CF';

const NetworkSelector: FC<Props> = ({
  toggleOpenClose,
  isExpanded,
  closeDrawer,
}) => {
  const context = useContext(ApplicationContext);
  const theme = context.theme;
  const networkContext = useNetworkContext();
  const [networkName, setNetworkName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const availableNetworks = useMemo(() => {
    return {
      [MAINNET_NETWORK.name]: MAINNET_NETWORK,
      [FUJI_NETWORK.name]: FUJI_NETWORK,
    };
  }, []);

  useEffect(() => {
    if (networkName != networkContext?.network?.name) {
      setNetworkName(networkContext?.network?.name ?? '');
      setLoading(false);
      if (isChanging) {
        closeDrawer();
      }
    }
  }, [networkContext?.network?.config]);

  function handleChangeNetwork(network: string) {
    setLoading(true);
    setIsChanging(true);
    // give chance for loading to be set and show the activity indicator.
    setTimeout(() => {
      networkContext?.setNetwork(availableNetworks[network]);
    }, 500);
  }

  return (
    <View style={{backgroundColor: theme.bgApp}}>
      <Pressable
        style={{paddingTop: 16, paddingBottom: 20, flexDirection: 'row'}}
        onPress={toggleOpenClose}>
        <AvaText.Body2
          color={theme.txtListItem}
          textStyle={{marginEnd: marginEnd}}>
          {`${DOT} ${networkName}`}
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
        onPress={() => handleChangeNetwork(MAINNET_NETWORK.name)}>
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
        onPress={() => handleChangeNetwork(FUJI_NETWORK.name)}>
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
      {loading && (
        <ActivityIndicator
          size={'small'}
          color={context.isDarkMode ? '#FFF' : '#000'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        />
      )}
    </View>
  );
};

export default NetworkSelector;
