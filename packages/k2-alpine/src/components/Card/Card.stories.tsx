import React, { useEffect, useMemo, useState } from 'react'
import { AppState, FlatList, ListRenderItem } from 'react-native'
import { ScrollView, Text, View } from '../Primitives'
import { showAlert, useTheme } from '../..'
import CheckIcon from '../../assets/icons/check.svg'
import { GRID_GAP, SCREEN_WIDTH } from '../../const'
import { Card } from './Card'
import {
  AddCard,
  CompletedCard,
  CompletedCardProps,
  ProgressCard,
  ProgressCardProps
} from './ProgressCard'

export default {
  title: 'Card'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16, alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <Text>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book. It has survived not
            only five centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged.
          </Text>
        </Card>

        <Card sx={{ width: '100%', height: 150 }}>
          <Text>
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry.
          </Text>
        </Card>

        <Card sx={{ width: 100, height: 100 }}>
          <CheckIcon />
        </Card>
      </ScrollView>
    </View>
  )
}

export const Progresses = (): JSX.Element => {
  const { theme } = useTheme()

  const [appState, setAppState] = useState(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const shouldAnimate = useMemo(() => appState === 'active', [appState])

  // console.log(motion)

  const completeCardBackground = theme.isDark
    ? require('../../assets/images/complete-card-bg-dark.png')
    : require('../../assets/images/complete-card-bg-light.png')

  const renderItem: ListRenderItem<
    ProgressCardProps | CompletedCardProps | 'Add'
  > = ({ item }) => {
    if (item === 'Add') {
      return <AddCard />
    }

    if ('progress' in item) {
      return (
        <ProgressCard
          title={item.title}
          progress={item.progress}
          width={(SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2}
          animated={shouldAnimate}
        />
      )
    }

    return (
      <CompletedCard
        title={item.title}
        action={item.action}
        backgroundImageSource={completeCardBackground}
      />
    )
  }

  const data: (ProgressCardProps | CompletedCardProps | 'Add')[] = [
    'Add',

    {
      title: '2.40 AVAX reward unlocked!',
      action: {
        title: 'Claim',
        onPress: () => {
          showAlert({ title: 'Claim', buttons: [{ text: 'OK' }] })
        }
      }
    },
    { title: '2.40 AVAX reward claimed' },
    { title: '0.50 AVAX reward unlocked in 17 days', progress: 0.01 },
    { title: '0.50 AVAX reward unlocked in 17 days', progress: 0.1 },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.2
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.3
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.4
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.5
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.5
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.6
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.7
    },
    {
      title: '0.50 AVAX reward unlocked in 17 days',
      progress: 0.8
    },
    {
      title: '2.40 AVAX reward in a months',
      progress: 0.9
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
