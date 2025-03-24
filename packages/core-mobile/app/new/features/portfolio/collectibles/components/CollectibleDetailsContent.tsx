import { Text, View } from '@avalabs/k2-alpine'
import React, { ReactNode, useMemo } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { NftItem } from 'services/nft/types'

import { noop } from '@avalabs/core-utils-sdk'
import { Row } from 'components/Row'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { DeFiRowItem } from 'features/portfolio/defi/components/DeFiRowItem'
import { useNetworks } from 'hooks/networks/useNetworks'
import { HORIZONTAL_MARGIN } from '../consts'
import { Statistic, StatisticGroup } from './CollectibleStatistic'

export const CollectibleDetailsContent = ({
  collectible
}: {
  collectible: NftItem | undefined
}): ReactNode => {
  const networks = useNetworks()

  const attributes = useMemo(
    () =>
      collectible?.processedMetadata?.attributes?.map(item => ({
        text: camelCaseToTitle(item.trait_type),
        value: item.value
      })) || [],
    [collectible?.processedMetadata?.attributes]
  )

  const renderStatistic: ListRenderItem<{
    text: string
    value: string
  }> = ({ item }) => {
    return (
      <DeFiRowItem>
        <Row style={{ flex: 1, alignItems: 'center', gap: 12 }}>
          <Text
            variant="body1"
            numberOfLines={1}
            ellipsizeMode="tail"
            sx={{ color: '$textSecondary', flexShrink: 1 }}>
            {item?.text}
          </Text>
        </Row>
        <Text variant="body1">{item.value}</Text>
      </DeFiRowItem>
    )
  }

  const ACTION_BUTTONS: ActionButton[] = [
    { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
    { title: ActionButtonTitle.Hide, icon: 'hide', onPress: noop }
  ]
  return (
    <View
      style={{
        gap: HORIZONTAL_MARGIN
      }}>
      <View
        style={{
          alignItems: 'center'
        }}>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>
      <View
        style={{
          paddingHorizontal: HORIZONTAL_MARGIN,
          gap: 8
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

        {attributes.length ? (
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
        ) : null}
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
