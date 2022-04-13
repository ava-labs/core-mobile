import React, { FC, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, UIManager, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  FUJI_NETWORK,
  MAINNET_NETWORK,
  useNetworkContext
} from '@avalabs/wallet-react-components'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AvaText from 'components/AvaText'

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true)

//const DOT = '\u25CF';

const NetworkSelector: FC = () => {
  const context = useApplicationContext()
  const theme = context.theme
  const networkContext = useNetworkContext()
  const { goBack } = useNavigation()
  const [networkName, setNetworkName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const availableNetworks = useMemo(() => {
    return {
      [MAINNET_NETWORK.name]: MAINNET_NETWORK,
      [FUJI_NETWORK.name]: FUJI_NETWORK
    }
  }, [])

  useEffect(() => {
    if (networkName !== networkContext?.network?.name) {
      setNetworkName(networkContext?.network?.name ?? '')
      setLoading(false)
      if (isChanging) {
        setIsChanging(false)
        goBack()
      }
    }
  }, [networkContext?.network?.config])

  function handleChangeNetwork(network: string) {
    if (network === networkContext?.network?.name) {
      return
    }
    setLoading(true)
    setIsChanging(true)
    // give chance for loading to be set and show the activity indicator.
    setTimeout(() => {
      networkContext?.setNetwork(availableNetworks[network])
    }, 500)
  }

  return (
    <View
      style={{
        flex: 1,
        marginVertical: 16
      }}>
      <AvaListItem.Base
        title={
          networkName === MAINNET_NETWORK.name
            ? selectedTitle(MAINNET_NETWORK.name)
            : unselectedTitle(MAINNET_NETWORK.name)
        }
        onPress={() => handleChangeNetwork(MAINNET_NETWORK.name)}
        background={
          networkName === MAINNET_NETWORK.name
            ? theme.colorBg2
            : theme.background
        }
        rightComponentVerticalAlignment={'center'}
        rightComponent={
          networkName === MAINNET_NETWORK.name && <CheckmarkSVG />
        }
      />
      <AvaListItem.Base
        title={
          networkName === FUJI_NETWORK.name
            ? selectedTitle(FUJI_NETWORK.name)
            : unselectedTitle(FUJI_NETWORK.name)
        }
        onPress={() => handleChangeNetwork(FUJI_NETWORK.name)}
        background={
          networkName === FUJI_NETWORK.name ? theme.colorBg2 : theme.background
        }
        rightComponentVerticalAlignment={'center'}
        rightComponent={networkName === FUJI_NETWORK.name && <CheckmarkSVG />}
      />
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
              justifyContent: 'center'
            }
          ]}
        />
      )}
    </View>
  )
}

const selectedTitle = (title: string) => {
  return (
    <AvaText.Heading3 textStyle={{ alignSelf: 'flex-start' }}>
      {title}
    </AvaText.Heading3>
  )
}

const unselectedTitle = (title: string) => {
  return (
    <AvaText.Body1 textStyle={{ alignSelf: 'flex-start' }}>
      {title}
    </AvaText.Body1>
  )
}

export default NetworkSelector
