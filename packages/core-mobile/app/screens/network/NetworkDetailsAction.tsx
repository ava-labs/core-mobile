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
import { useDispatch } from 'react-redux'
import { removeCustomNetwork, toggleEnabledChainId } from 'store/network'
import { showSnackBarCustom } from 'components/Snackbar'
import GeneralToast from 'components/toast/GeneralToast'
import { useNetworks } from 'hooks/networks/useNetworks'

export function NetworkDetailsAction(): JSX.Element {
  const { chainId } = useRoute<NetworkDetailsScreenProps['route']>().params
  const { getIsCustomNetwork } = useNetworks()
  const isCustomNetwork = getIsCustomNetwork(chainId)

  return (
    <Row style={{ alignItems: 'center', marginRight: 8 }}>
      <ToggleEnabledNetwork chainId={chainId} />
      {isCustomNetwork && (
        <>
          <CustomNetworkDropdown />
          <Space x={4} />
        </>
      )}
    </Row>
  )
}

type NetworkSelectorScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkSelector
>
type NetworkDetailsScreenProps = WalletScreenProps<
  typeof AppNavigation.Wallet.NetworkDetails
>

function ToggleEnabledNetwork({ chainId }: { chainId: number }): JSX.Element {
  const { enabledNetworks } = useNetworks()
  const dispatch = useDispatch()
  const isFavorite = enabledNetworks.some(
    network => network.chainId === chainId
  )

  return (
    <AvaButton.Icon onPress={() => dispatch(toggleEnabledChainId(chainId))}>
      <StarSVG selected={isFavorite} testID="star_svg" />
    </AvaButton.Icon>
  )
}

function CustomNetworkDropdown(): JSX.Element {
  const dispatch = useDispatch()
  const { params } = useRoute<NetworkDetailsScreenProps['route']>()
  const { navigate } = useNavigation<NetworkSelectorScreenProps['navigation']>()
  const { getFromPopulatedNetwork } = useNetworks()

  const network = getFromPopulatedNetwork(params.chainId)

  function handleEdit(): void {
    navigate(AppNavigation.Wallet.NetworkAddEdit, {
      mode: 'edit',
      network
    })
  }

  function handleDelete(): void {
    if (!network) {
      showSnackBarCustom({
        component: (
          <GeneralToast
            message={`Ooops, seems this network is not available. Please try adding it again.`}
          />
        ),
        duration: 'short'
      })
      return
    }

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

  function renderOption({ item }: { item: DropdownItem }): JSX.Element {
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
  icon: JSX.Element
  action: () => void
  color?: string
}

function Option({ item }: { item: DropdownItem }): JSX.Element {
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
