import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Dropdown from 'components/Dropdown'
import Avatar from 'components/Avatar'
import { ShowSnackBar } from 'components/Snackbar'
import { View } from 'react-native'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import AppNavigation from 'navigation/AppNavigation'
import { DrawerScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { getIcon } from 'screens/network/NetworkIconSelector'
import { getActiveNetwork } from 'screens/network/SupportedNetworkMapper'
import { useNetworkContext } from '@avalabs/wallet-react-components'
import {
  selectFavoriteNetworks,
  selectActiveNetwork,
  setActive
} from 'store/network'

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
  const networkContext = useNetworkContext()

  const data = useMemo(
    () => [
      ...favoriteNetworks.map(item => ({
        name: item.name,
        chainId: item.chainId
      }))
      //{ name: ManageNetworks, chainId: '' } //TODO: currently we wont support this, but let's keep it because eventually we will
    ],
    [favoriteNetworks]
  )

  const selectedNetworkIndex = data.findIndex(
    item => item.chainId === activeNetwork.chainId
  )

  return (
    <View
      style={[
        {
          height: 24,
          width: 52,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 4,
          alignItems: 'flex-end',
          backgroundColor: theme.colorBg2,
          borderRadius: 100
        }
      ]}>
      <Dropdown
        data={data}
        width={220}
        selectedIndex={selectedNetworkIndex === -1 ? 0 : selectedNetworkIndex}
        onItemSelected={selectedItem => {
          if (selectedItem.name === ManageNetworks) {
            navigation.navigate(AppNavigation.Wallet.NetworkSelector)
          } else {
            // TODO: remove this once we finish refactoring network stuff
            const activeNetwork = getActiveNetwork(selectedItem.name)
            if (activeNetwork) {
              networkContext?.setNetwork(activeNetwork)
            } else {
              ShowSnackBar('Not yet supported')
            }

            // update redux store
            dispatch(setActive(selectedItem.chainId))
          }
        }}
        alignment={'flex-end'}
        selectionRenderItem={selectedItem => (
          <Selection icon={getIcon(selectedItem.chainId)} />
        )}
        optionsRenderItem={({ item }) => (
          <Option
            networkChainId={item.chainId}
            networkName={item.name}
            isSelected={item.chainId === activeNetwork.chainId}
          />
        )}
      />
    </View>
  )
}

function Selection({ icon }: { icon: string | JSX.Element }) {
  return typeof icon === 'string' ? (
    <Avatar.Custom size={40} name={''} logoUri={icon} />
  ) : (
    icon
  )
}

function Option({
  networkChainId,
  networkName,
  isSelected
}: {
  networkChainId: string
  networkName: string
  isSelected: boolean
}) {
  return (
    <Row
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      <Selection icon={getIcon(networkChainId)} />
      <Space x={8} />
      <AvaText.Body1 textStyle={{ paddingVertical: 8 }}>
        {networkName}
      </AvaText.Body1>
      <FlexSpacer />
      {isSelected && <CheckmarkSVG color={'white'} />}
    </Row>
  )
}
