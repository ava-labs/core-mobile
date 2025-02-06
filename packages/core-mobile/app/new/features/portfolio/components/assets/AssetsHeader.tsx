import {
  IndexPath,
  ScrollView,
  SquareButton,
  SquareButtonIconType,
  View
} from '@avalabs/k2-alpine'
import React from 'react'
import {
  ASSET_BALANCE_SORTS,
  ASSET_NETWORK_FILTERS,
  AssetsDropdown
} from './AssetsDrowndown'
import { AssetsManageView } from './AssetsView'

const BUTTONS: { title: string; icon: SquareButtonIconType }[] = [
  { title: 'Bridge', icon: 'bridge' },
  { title: 'Swap', icon: 'swap' },
  { title: 'Send', icon: 'send' },
  { title: 'Buy', icon: 'buy' },
  { title: 'Connect', icon: 'connect' }
]

interface Props {
  selectedFilter: IndexPath
  setSelectedFilter: (value: IndexPath) => void
  selectedSort: IndexPath
  setSelectedSort: (value: IndexPath) => void
}

export const AssetsHeader = ({
  selectedFilter,
  selectedSort,
  setSelectedFilter,
  setSelectedSort
}: Props): React.JSX.Element => {
  const renderOptions = (): React.JSX.Element => {
    return (
      <View
        sx={{
          marginTop: 19,
          marginBottom: 16,
          justifyContent: 'space-between',
          flexDirection: 'row'
        }}>
        <View sx={{ flexDirection: 'row', gap: 8 }}>
          <AssetsDropdown
            name={'Filter'}
            options={ASSET_NETWORK_FILTERS}
            selectedValue={selectedFilter}
            setSelectedValue={setSelectedFilter}
          />
          <AssetsDropdown
            name={'Sort'}
            options={ASSET_BALANCE_SORTS}
            selectedValue={selectedSort}
            setSelectedValue={setSelectedSort}
          />
        </View>
        <AssetsManageView />
      </View>
    )
  }
  return (
    <View>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        horizontal
        sx={{ flexGrow: 0 }}
        contentContainerStyle={{
          width: '100%'
        }}>
        <View style={{ gap: 10, flexDirection: 'row' }}>
          {BUTTONS.map((button, index) => (
            <SquareButton key={index} title={button.title} icon={button.icon} />
          ))}
        </View>
      </ScrollView>
      {renderOptions()}
    </View>
  )
}
