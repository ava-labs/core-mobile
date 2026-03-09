import React, { useCallback, useMemo } from 'react'
import { Icons, Image, Text, useTheme, View } from '@avalabs/k2-alpine'
import { DropdownGroup, DropdownMenu } from 'common/components/DropdownMenu'
import { MarketName, MarketNames } from '../types'
import { useSelectedBorrowProtocol } from '../hooks/useBorrowProtocol'
import { PROTOCOL_DISPLAY_NAMES } from '../consts'

const PROTOCOL_LOGOS: Record<MarketName, number> = {
  [MarketNames.aave]: require('../../../assets/icons/aave.png'),
  [MarketNames.benqi]: require('../../../assets/icons/benqi.png')
}

export const BorrowProtocolSelector = (): React.JSX.Element => {
  const { theme } = useTheme()
  const [selectedProtocol, setSelectedProtocol] = useSelectedBorrowProtocol()

  const dropdownGroups: DropdownGroup[] = useMemo(
    () => [
      {
        key: 'borrow-protocol-group',
        items: [
          {
            id: MarketNames.aave,
            title: PROTOCOL_DISPLAY_NAMES[MarketNames.aave],
            selected: selectedProtocol === MarketNames.aave
          },
          {
            id: MarketNames.benqi,
            title: PROTOCOL_DISPLAY_NAMES[MarketNames.benqi],
            selected: selectedProtocol === MarketNames.benqi
          }
        ]
      }
    ],
    [selectedProtocol]
  )

  const handlePressAction = useCallback(
    (event: { nativeEvent: { event: string } }) => {
      const protocol = event.nativeEvent.event as MarketName
      if (protocol === MarketNames.aave || protocol === MarketNames.benqi) {
        setSelectedProtocol(protocol)
      }
    },
    [setSelectedProtocol]
  )

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text variant="heading2">Borrow on </Text>
      <DropdownMenu groups={dropdownGroups} onPressAction={handlePressAction}>
        <View
          sx={{
            marginTop: -4,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '$surfaceSecondary',
            paddingTop: 6,
            paddingBottom: 2,
            paddingLeft: 8,
            paddingRight: 6,
            borderRadius: 100,
            gap: 6
          }}>
          <Image
            source={PROTOCOL_LOGOS[selectedProtocol]}
            style={{ width: 27, height: 27, borderRadius: 14, marginTop: -4 }}
          />
          <Text variant="heading2">
            {PROTOCOL_DISPLAY_NAMES[selectedProtocol]}
          </Text>
          <Icons.Navigation.ExpandMore
            style={{ marginTop: -2 }}
            width={24}
            height={24}
            color={theme.colors.$textSecondary}
          />
        </View>
      </DropdownMenu>
    </View>
  )
}
