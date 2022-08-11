import { useNavigation, useRoute } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import AvaText from 'components/AvaText'
import DropDown from 'components/Dropdown'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import DeleteSVG from 'components/svg/DeleteSVG'
import EditSVG from 'components/svg/EditSVG'
import EllipsisSVG from 'components/svg/EllipsisSVG'
import StarSVG from 'components/svg/StarSVG'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import React from 'react'
import { Alert, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  removeCustomNetwork,
  selectFavoriteNetworks,
  selectIsCustomNetwork,
  selectNetworks,
  toggleFavorite
} from 'store/network'

export function NetworkDetailsAction() {
  const { chainId } = useRoute<NetworkDetailsScreenProps['route']>().params
  const isCustomNetwork = useSelector(selectIsCustomNetwork(chainId))

  return (
    <Row style={{ alignItems: 'center' }}>
      <ToggleFavoriteNetwork chainId={chainId} />
      {isCustomNetwork && <CustomNetworkDropdown />}
    </Row>
  )
}

type NetworkSelectorScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkSelector
>
type NetworkDetailsScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkDetails
>

function ToggleFavoriteNetwork({ chainId }: { chainId: number }) {
  const favoriteNetworks = useSelector(selectFavoriteNetworks)
  const dispatch = useDispatch()
  const isFavorite = favoriteNetworks.some(
    network => network.chainId === chainId
  )

  return (
    <AvaButton.Icon onPress={() => dispatch(toggleFavorite(chainId))}>
      <StarSVG selected={isFavorite} />
    </AvaButton.Icon>
  )
}

function CustomNetworkDropdown() {
  const dispatch = useDispatch()
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()
  const { navigate } = useNavigation<NetworkSelectorScreenProps['navigation']>()
  const networks = useSelector(selectNetworks)
  const network = networks[params.chainId]

  function handleEdit() {
    navigate(AppNavigation.Wallet.NetworkAddEdit, {
      mode: 'edit',
      network
    })
  }

  function handleDelete() {
    Alert.alert(
      'Delete Network',
      'Are you sure you want to delete this network?',
      [
        {
          text: 'Delete',
          onPress: () => dispatch(removeCustomNetwork(network.chainId)),
          style: 'destructive'
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  function renderOption({ item }: { item: DropdownItem }) {
    return <Option item={item} />
  }

  const dropdownItems: DropdownItem[] = [
    { name: 'Edit', icon: <EditSVG />, action: handleEdit },
    {
      name: 'Delete',
      icon: <DeleteSVG />,
      action: handleDelete,
      color: '#F1595A'
    }
  ]

  return (
    <View
      style={[
        {
          height: 32,
          width: 32,
          alignItems: 'flex-end'
        }
      ]}>
      <DropDown
        data={dropdownItems}
        alignment={'flex-end'}
        width={150}
        onItemSelected={({ action }) => action()}
        selectionRenderItem={() => null}
        optionsRenderItem={renderOption}
        caretIcon={<EllipsisSVG />}
      />
    </View>
  )
}

type DropdownItem = {
  name: string
  icon: Element
  action: () => void
  color?: string
}

function Option({ item }: { item: DropdownItem }) {
  return (
    <Row
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      {item.icon}
      <Space x={8} />
      <AvaText.Body1
        color={item.color}
        textStyle={{ paddingVertical: 8, maxWidth: 220 }}
        ellipsizeMode="tail">
        {item.name}
      </AvaText.Body1>
    </Row>
  )
}
