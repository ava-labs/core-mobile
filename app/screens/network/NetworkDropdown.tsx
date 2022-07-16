import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import Avatar from 'components/Avatar'
import { View } from 'react-native'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import AppNavigation from 'navigation/AppNavigation'
import { DrawerScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import {
  selectActiveNetwork,
  selectFavoriteNetworks,
  setActive
} from 'store/network'
import { arrayHash } from 'utils/Utils'

const ManageNetworks = 'Manage networks'

type NetworkDropdownNavigationProp = DrawerScreenProps<
  typeof AppNavigation.Wallet.Tabs
>['navigation']

export default function NetworkDropdown() {
  const favoriteNetworks = useSelector(selectFavoriteNetworks)
  const activeNetwork = useSelector(selectActiveNetwork)
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
      ...favoriteNetworks
        .filter(item => item.chainId !== activeNetwork.chainId)
        .map(item => ({
          name: item.chainName,
          chainId: item.chainId,
          logoUri: item.logoUri
        })),
      { name: ManageNetworks, chainId: 0, logoUri: '' }
    ],
    [activeNetwork, favoriteNetworks]
  )

  const dropdownUniqueId = useMemo(() => {
    const chainIds = data.map(item => item.chainId.toString())
    return arrayHash(chainIds)
  }, [data])

  const selectedNetworkIndex = data.findIndex(
    item => item.chainId === activeNetwork.chainId
  )

  return (
    <View
      style={[
        {
          height: 24,
          width: 54,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignItems: 'flex-end',
          backgroundColor: theme.colorBg2,
          borderRadius: 100
        }
      ]}>
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
            navigation.navigate(AppNavigation.Wallet.NetworkSelector)
          } else {
            dispatch(setActive(selectedItem.chainId))
          }
        }}
        alignment={'flex-end'}
        selectionRenderItem={selectedItem => (
          <Selection icon={selectedItem.logoUri} />
        )}
        optionsRenderItem={({ item }) => (
          <Option
            networkName={item.name}
            networkLogo={item.logoUri}
            isSelected={item.chainId === activeNetwork.chainId}
          />
        )}
      />
    </View>
  )
}

function Selection({ icon }: { icon: string | JSX.Element }) {
  return typeof icon === 'string' ? (
    <Avatar.Custom size={16} name={''} logoUri={icon} />
  ) : (
    icon
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
}) {
  return (
    <Row
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      {!!networkLogo && (
        <>
          <Selection icon={networkLogo} />
          <Space x={8} />
        </>
      )}
      <AvaText.Body1
        textStyle={{ paddingVertical: 8, maxWidth: 220 }}
        ellipsizeMode="tail">
        {networkName}
      </AvaText.Body1>
      <FlexSpacer />
      {isSelected && <CheckmarkSVG color={'white'} />}
    </Row>
  )
}
