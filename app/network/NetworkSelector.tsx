import React, {FC, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import CheckmarkSVG from 'components/svg/CheckmarkSVG';
import AvaButton from 'components/AvaButton';

interface Props {
  closeDrawer: () => void;
}

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

const FLEX_BASIS = 53;
const marginEnd = 12;
const DOT = '\u25CF';

const NetworkSelector: FC<Props> = ({closeDrawer}) => {
  const context = useApplicationContext();
  const theme = context.theme;
  const networkContext = useNetworkContext();
  const [networkName, setNetworkName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [flexBasis, setFlexBasis] = useState<number | undefined>(FLEX_BASIS);
  const [isExpanded, setIsExpanded] = useState(false);

  const availableNetworks = useMemo(() => {
    return {
      [MAINNET_NETWORK.name]: MAINNET_NETWORK,
      [FUJI_NETWORK.name]: FUJI_NETWORK,
    };
  }, []);

  useEffect(() => {
    LayoutAnimation.easeInEaseOut();
    setFlexBasis(isExpanded ? undefined : FLEX_BASIS);
  }, [isExpanded]);

  useEffect(() => {
    if (networkName !== networkContext?.network?.name) {
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
    <View
      style={{
        paddingHorizontal: 16,
        flexBasis: flexBasis,
        overflow: 'hidden',
      }}>
      <AvaButton.Base
        style={styles.item}
        onPress={() => {
          setIsExpanded(!isExpanded);
        }}>
        <AvaText.Body2
          color={theme.txtListItem}
          textStyle={{marginEnd: marginEnd}}>
          {`${DOT} ${networkName}`}
        </AvaText.Body2>
        <CarrotSVG
          direction={isExpanded ? 'up' : 'down'}
          size={16}
          color={theme.colorText1}
        />
      </AvaButton.Base>
      <AvaButton.Base
        style={[styles.item, styles.checkable]}
        onPress={() => handleChangeNetwork(MAINNET_NETWORK.name)}>
        <AvaText.Body1 color={theme.txtListItem}>
          {MAINNET_NETWORK.name}
        </AvaText.Body1>
        {networkName === MAINNET_NETWORK.name && <CheckmarkSVG />}
      </AvaButton.Base>
      <AvaButton.Base
        style={[styles.item, styles.checkable]}
        onPress={() => handleChangeNetwork(FUJI_NETWORK.name)}>
        <AvaText.Body1 color={theme.txtListItem}>
          {FUJI_NETWORK.name.trim()}
        </AvaText.Body1>
        {networkName === FUJI_NETWORK.name && <CheckmarkSVG />}
      </AvaButton.Base>

      {/*<AvaButton.TextLarge style={{alignSelf: 'flex-start', marginLeft: -16}}>*/}
      {/*  Add Network*/}
      {/*</AvaButton.TextLarge>*/}
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

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    flexDirection: 'row',
  },
  checkable: {
    justifyContent: 'space-between',
  },
});
export default NetworkSelector;
