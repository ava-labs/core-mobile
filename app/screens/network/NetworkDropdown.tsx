import React, { useMemo } from 'react'
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
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigatorProps } from 'react-native-screens/lib/typescript/native-stack/types'
import { getIcon } from 'screens/network/NetworkIconSelector'

const ManageNetworks = 'Manage networks'
export default function NetworkDropdown() {
  const { networks } = useApplicationContext().repo.networksRepo
  const { theme } = useApplicationContext()
  const navigation = useNavigation<NativeStackNavigatorProps>()

  const data = useMemo(
    () => [
      ...Object.values(networks)
        .filter(item => item.isFavorite)
        .map(item => item.name),
      ManageNetworks
    ],
    [networks]
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
        preselectedIndex={0}
        onItemSelected={selectedItem => {
          if (selectedItem === ManageNetworks) {
            navigation?.navigate(AppNavigation.Wallet.NetworkSelector)
            return false
          } else {
            ShowSnackBar(selectedItem)
          }
        }}
        alignment={'flex-end'}
        selectionRenderItem={selectedItem => (
          <Selection icon={getIcon(selectedItem)} />
        )}
        optionsRenderItem={info => (
          <Option networkName={info.item} isSelected={info.isSelected} />
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
  networkName,
  isSelected
}: {
  networkName: string
  isSelected: boolean
}) {
  return (
    <Row
      style={{
        alignItems: 'center',
        paddingHorizontal: 16
      }}>
      <Selection icon={getIcon(networkName)} />
      <Space x={8} />
      <AvaText.Body1 textStyle={{ paddingVertical: 8 }}>
        {networkName}
      </AvaText.Body1>
      <FlexSpacer />
      {isSelected && <CheckmarkSVG color={'white'} />}
    </Row>
  )
}
