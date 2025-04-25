import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import { View } from 'react-native'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import AppNavigation from 'navigation/AppNavigation'
import { DrawerScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { setActive } from 'store/network'
import { arrayHash } from 'utils/Utils'
import SettingsCogSVG from 'components/svg/SettingsCogSVG'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { NetworkLogo } from './NetworkLogo'

const ManageNetworks = 'Manage Networks'

type NetworkDropdownNavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']

export default function NetworkDropdown(): JSX.Element {
  const { enabledNetworks, activeNetwork } = useNetworks()
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const navigation = useNavigation<NetworkDropdownNavigationProp>()

  const data = useMemo(
    () => [
      {
        name: activeNetwork.chainName,
        chainId: activeNetwork.chainId,
        logoUri: activeNetwork.logoUri
      },
      ...enabledNetworks
        .filter(item => item.chainId !== activeNetwork.chainId)
        .map(item => ({
          name: item.chainName,
          chainId: item.chainId,
          logoUri: item.logoUri
        })),
      { name: ManageNetworks, chainId: 0, logoUri: '' }
    ],
    [activeNetwork, enabledNetworks]
  )

  const dropdownUniqueId = useMemo(() => {
    const chainIds = data.map(item => item.chainId.toString())
    return arrayHash(chainIds)
  }, [data])

  const selectedNetworkIndex = data.findIndex(
    item => item.chainId === activeNetwork.chainId
  )

  // eslint-disable-next-line prettier/prettier
  const renderSelection = (selectedItem: (typeof data)[0]): JSX.Element => (
    <Selection logoUri={selectedItem.logoUri} />
  )

  // eslint-disable-next-line prettier/prettier
  const renderOption = ({ item }: { item: (typeof data)[0] }): JSX.Element => (
    <Option
      networkName={item.name}
      networkLogo={item.logoUri}
      isSelected={item.chainId === activeNetwork.chainId}
    />
  )

  const handleOnDropDownToggle = (isOpen: boolean): void => {
    if (isOpen) {
      AnalyticsService.capture('NetworkSwitcherOpened')
    }
  }

  return (
    <View
      style={[
        {
          height: 34,
          width: 64,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignItems: 'flex-end',
          backgroundColor: theme.colorBg2,
          borderRadius: 100
        }
      ]}
      testID="network_dropdown_main">
      <Dropdown
        key={dropdownUniqueId}
        style={{
          left: 4
        }}
        data={data}
        width={300}
        selectedIndex={selectedNetworkIndex === -1 ? 0 : selectedNetworkIndex}
        onItemSelected={selectedItem => {
          if (selectedItem.name === ManageNetworks) {
            AnalyticsService.capture('ManageNetworksClicked')
            navigation.navigate(AppNavigation.Wallet.NetworkSelector)
          } else {
            dispatch(setActive(selectedItem.chainId))
          }
        }}
        alignment={'flex-end'}
        selectionRenderItem={renderSelection}
        optionsRenderItem={renderOption}
        caretStyle={{ marginRight: 6 }}
        onDropDownToggle={handleOnDropDownToggle}
      />
    </View>
  )
}

function Selection({ logoUri }: { logoUri: string }): JSX.Element {
  return (
    <View style={{ marginRight: 2 }}>
      <NetworkLogo
        logoUri={logoUri}
        size={16}
        testID="network_dropdown__logo"
      />
    </View>
  )
}

function Option({
  networkLogo,
  networkName,
  isSelected
}: {
  networkLogo: string
  networkName: string
  isSelected: boolean
}): JSX.Element {
  return (
    <Row
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      {networkName !== ManageNetworks && <Selection logoUri={networkLogo} />}
      {networkName === ManageNetworks && <SettingsCogSVG size={16} />}
      <Space x={8} />
      <AvaText.Body1
        textStyle={{ paddingVertical: 8, maxWidth: 220 }}
        ellipsizeMode="tail"
        testID={`network_dropdown__${networkName}`}>
        {networkName}
      </AvaText.Body1>
      <FlexSpacer />
      {isSelected && (
        <CheckmarkSVG
          color={'white'}
          testID={`network_dropdown_check_mark__${networkName}`}
        />
      )}
    </Row>
  )
}
