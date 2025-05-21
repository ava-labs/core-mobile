import React from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { View } from '../../Primitives'
import { showAlert } from '../..'
import { GRID_GAP, SCREEN_WIDTH } from '../../../const'
import { useMotion } from '../../../hooks/useMotion'
import { useTheme } from '../../../hooks'
import { ProgressCard, ProgressCardProps } from './ProgressCard'
import { CompletedCard, CompletedCardProps } from './CompleteCard'
import { AddCard } from './AddCard'
import { ClaimCard } from './ClaimCard'

export default {
  title: 'Staking Cards'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const motion = useMotion(true)

  const completeCardBackground = theme.isDark
    ? require('../../../assets/images/complete-card-bg-dark.png')
    : require('../../../assets/images/complete-card-bg-light.png')

  const renderItem: ListRenderItem<
    ProgressCardProps | CompletedCardProps | 'Add' | 'Claim'
  > = ({ item }) => {
    if (item === 'Add') {
      return <AddCard width={CARD_WIDTH} />
    }

    if (item === 'Claim') {
      return (
        <ClaimCard
          width={CARD_WIDTH}
          title="2.40 AVAX reward unlocked!"
          backgroundImageSource={completeCardBackground}
          onPress={() =>
            showAlert({ title: 'Claim', buttons: [{ text: 'OK' }] })
          }
        />
      )
    }

    if ('progress' in item) {
      return (
        <ProgressCard
          title={item.title}
          progress={item.progress}
          width={CARD_WIDTH}
          motion={motion}
        />
      )
    }

    return <CompletedCard title={item.title} width={CARD_WIDTH} />
  }

  const data: (ProgressCardProps | CompletedCardProps | 'Add' | 'Claim')[] = [
    'Add',
    'Claim',
    { title: '2.40 AVAX reward claimed' },
    { title: '0.50 AVAX reward unlocked in 17 days', progress: 0.01 },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.2
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.4
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.6
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.8
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.99
    }
  ]

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <FlatList
        contentContainerStyle={{ padding: 16, gap: 12 }}
        data={data}
        renderItem={renderItem}
        numColumns={2}
        keyExtractor={(_, index) => index.toString()}
        columnWrapperStyle={{ gap: 14 }}
      />
    </View>
  )
}

const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2)
