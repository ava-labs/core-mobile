import {
  AnimatedPressable,
  Button,
  SCREEN_WIDTH,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useHeaderHeight } from '@react-navigation/elements'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { HORIZONTAL_MARGIN } from 'features/browser/consts'
import { CardContainer } from 'features/portfolio/collectibles/components/CardContainer'
import React, { useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { addHistoryForActiveTab, addTab, selectActiveTab } from 'store/browser'

import JoepegsLogo from '../../../../assets/joepegs.svg'
import OpenseaLogo from '../../../../assets/opensea.svg'
import PopularRibbon from '../../../../assets/popular-ribbon.svg'
import SalvorLogo from '../../../../assets/salvor.svg'

type CollectibleApp = {
  id: string
  title: string
  description: string
  website: string
  colors: [string, string]
  popular?: boolean
}

const DISCOVER_COLLECTIBLES: CollectibleApp[] = [
  {
    id: 'opensea',
    title: 'OpenSea',
    description:
      "is the world's first and largest web3 marketplace for NFTs and crypto collectibles. Browse, create, buy, sell, and auction NFTs",
    website: 'https://opensea.io/',
    colors: ['#26A5E3', '#2081E2'],
    popular: true
  },
  {
    id: 'joepegs',
    title: 'Joepegs',
    description:
      'is the leading Web3 platform for NFTs and digital collectibles. As a cultural hub in the Web3 space, we offer secure buying, selling, and discovery of innovative digital assets',
    website: 'https://joepegs.com/',
    colors: ['#130632', '#513690']
  },
  {
    id: 'salvor',
    title: 'Salvor',
    description:
      'is a combination of fresh understanding of contemporary digital arts and assets and a sustainable approach to new ways of doing creative business',
    website: 'https://salvor.io/',
    colors: ['#121315', '#2B3D4B']
  }
]

const NUMBER_OF_COLUMNS = 2
const TAB_WIDTH = (SCREEN_WIDTH - HORIZONTAL_MARGIN) / NUMBER_OF_COLUMNS

export default function DiscoverCollectiblesScreen(): JSX.Element {
  const { navigate, back } = useRouter()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const dispatch = useDispatch()
  const activeTab = useSelector(selectActiveTab)

  const handlePress = (item: CollectibleApp): void => {
    dispatch(addTab())
    if (activeTab) {
      dispatch(addHistoryForActiveTab({ url: item.website, title: item.title }))
      back()
      // @ts-ignore TODO: make routes typesafe
      navigate('/(signedIn)/(tabs)/browser')
    }
  }

  const renderLogo = (id: string): React.ReactNode => {
    switch (id) {
      case 'opensea':
        return <OpenseaLogo />
      case 'joepegs':
        return <JoepegsLogo />
      case 'salvor':
        return <SalvorLogo />
      default:
        return null
    }
  }

  const renderItem: ListRenderItem<CollectibleApp> = ({
    item
  }): JSX.Element | null => {
    return (
      <AnimatedPressable onPress={() => handlePress(item)}>
        <CardContainer
          style={{
            height: 'auto',
            marginBottom: 12
          }}>
          <LinearGradient
            colors={item.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              height: 190,
              width: '100%',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {item?.popular ? (
              <View style={{ position: 'absolute', top: 0, left: 0 }}>
                <PopularRibbon />
              </View>
            ) : null}
            {renderLogo(item.id)}
          </LinearGradient>
          <View
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              gap: 24,
              paddingHorizontal: 18,
              paddingBottom: 13,
              paddingTop: 17
            }}>
            <View style={{ flex: 1 }}>
              <Text
                variant="subtitle2"
                style={{
                  color: theme.colors.$textSecondary
                }}>
                <Text variant="subtitle2" style={{ fontWeight: 500 }}>
                  {`${item.title} `}
                </Text>
                {item.description}
              </Text>
            </View>

            <Button
              type="secondary"
              onPress={() => handlePress(item)}
              size="small">
              Open
            </Button>
          </View>
        </CardContainer>
      </AnimatedPressable>
    )
  }

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          gap: 6,
          marginBottom: 36
        }}>
        <Text variant="heading2">{`Start your\nNFT collection`}</Text>
        <Text>
          {`It's time to browse and find a digital artwork that you'd like to own! Here's where to start with popular Core-friendly platforms`}
        </Text>
      </View>
    )
  }, [])

  return (
    <FlashList
      data={DISCOVER_COLLECTIBLES}
      contentContainerStyle={{
        paddingTop: headerHeight + 22,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: HORIZONTAL_MARGIN
      }}
      showsVerticalScrollIndicator={false}
      renderItem={renderItem}
      estimatedItemSize={TAB_WIDTH * 1.2}
      keyExtractor={item => item.id}
      ListHeaderComponent={renderHeader}
    />
  )
}
