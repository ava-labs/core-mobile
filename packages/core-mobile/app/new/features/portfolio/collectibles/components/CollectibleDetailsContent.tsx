import { Button, ScrollView, View } from '@avalabs/k2-alpine'
import React, { ReactNode, useMemo } from 'react'
import { NftItem } from 'services/nft/types'

import { noop } from '@avalabs/core-utils-sdk'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HORIZONTAL_MARGIN } from '../consts'
import { Statistic, StatisticGroup } from './CollectibleStatistic'

export const CollectibleDetailsContent = ({
  collectible,
  isExpanded
}: {
  collectible: NftItem | undefined
  isExpanded: boolean
}): ReactNode => {
  const insets = useSafeAreaInsets()
  const networks = useNetworks()

  const attributes = useMemo(
    () =>
      collectible?.processedMetadata?.attributes?.map(item => ({
        text: camelCaseToTitle(item.trait_type),
        value: item.value
      })) || [],
    [collectible?.processedMetadata?.attributes]
  )

  const ACTION_BUTTONS: ActionButton[] = [
    { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
    { title: ActionButtonTitle.Hide, icon: 'hide', onPress: noop }
  ]
  return (
    <View
      style={{
        gap: 20,
        flex: 1,
        overflow: 'hidden'
      }}>
      <View
        sx={{
          alignItems: 'center',
          zIndex: 10
        }}>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>

      <ScrollView
        scrollEnabled={isExpanded}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          gap: 12,
          paddingBottom: 150 + insets.bottom
        }}>
        <StatisticGroup>
          <Statistic
            inline
            text={'Created by'}
            value={
              collectible?.address ? formatAddress(collectible.address) : ''
            }
          />
        </StatisticGroup>

        <StatisticGroup>
          <Statistic inline text={'Standard'} value={collectible?.type} />
          <Statistic
            inline
            text={'Chain'}
            value={
              networks.getNetwork(collectible?.chainId)?.chainName ||
              'Unknown network'
            }
          />
        </StatisticGroup>

        {/* TODO: Decide if we do it horizontally or vertically, ask design */}
        <StatisticGroup>
          {attributes.map((attribute, index) => (
            <Statistic
              key={index}
              inline
              text={attribute.text}
              value={attribute.value}
            />
          ))}
        </StatisticGroup>

        {/* {attributes.length ? (
          <FlatList
            horizontal
            data={attributes}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingHorizontal: HORIZONTAL_MARGIN
            }}
            renderItem={renderStatistic}
          />
        ) : null} */}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0
        }}>
        <LinearGradientBottomWrapper>
          <View
            style={{
              gap: 10,
              padding: HORIZONTAL_MARGIN,
              paddingBottom: insets.bottom + HORIZONTAL_MARGIN
            }}>
            <Button type="secondary" size="large">
              Refresh
            </Button>
            <Button type="secondary" size="large">
              Set as my avatar
            </Button>
          </View>
        </LinearGradientBottomWrapper>
      </View>
    </View>
  )
}

function camelCaseToTitle(text: string): string {
  return text.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
    return str.toUpperCase().trim()
  })
}

const formatAddress = (address?: string): string => {
  if (!address) return ''
  return `${address?.substring(0, 6)}...${address?.substring(
    address?.length - 4
  )}`
}
