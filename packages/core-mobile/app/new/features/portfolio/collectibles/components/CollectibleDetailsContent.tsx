import { Button, ScrollView, View } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { NftItem } from 'services/nft/types'

import { noop } from '@avalabs/core-utils-sdk'
import { useNavigation } from '@react-navigation/native'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { showSnackbar } from 'common/utils/toast'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isCollectibleVisible } from 'store/nft/utils'
import {
  selectCollectibleVisibility,
  toggleCollectibleVisibility
} from 'store/portfolio'
import { useCollectiblesContext } from '../CollectiblesContext'
import { camelCaseToTitle, formatAddress, HORIZONTAL_MARGIN } from '../consts'
import { Statistic, StatisticGroup } from './CollectibleStatistic'

export const CollectibleDetailsContent = ({
  collectible,
  collectibles,
  isExpanded
}: {
  collectible: NftItem | undefined
  collectibles: NftItem[]
  isExpanded: boolean
}): ReactNode => {
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const networks = useNetworks()
  const { goBack } = useNavigation()

  const { refreshMetadata, isCollectibleRefreshing } = useCollectiblesContext()

  const canRefreshMetadata = useMemo(() => {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const refreshBackoff = 3600

    const updatedAt = collectible?.metadata?.lastUpdatedTimestamp

    return !updatedAt || currentTimestamp > updatedAt + refreshBackoff
  }, [collectible])

  const isRefreshing = useMemo(() => {
    if (!collectible) return false

    return isCollectibleRefreshing(collectible.localId)
  }, [isCollectibleRefreshing, collectible])

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (!collectible) return
    if (!canRefreshMetadata) {
      showSnackbar('Refresh is only available once per hour')
      return
    }

    await refreshMetadata(collectible, collectible.chainId)
  }, [canRefreshMetadata, collectible, refreshMetadata])

  const attributes = useMemo(
    () =>
      collectible?.processedMetadata?.attributes?.map(item => ({
        text: camelCaseToTitle(item.trait_type),
        value: item.value
      })) || [],
    [collectible?.processedMetadata?.attributes]
  )

  const collectibleVisibility = useSelector(selectCollectibleVisibility)
  const isVisible = collectible
    ? isCollectibleVisible(collectibleVisibility, collectible)
    : false

  const toggleHidden = useCallback((): void => {
    if (collectible?.localId) {
      dispatch(toggleCollectibleVisibility({ uid: collectible.localId }))

      if (isVisible) {
        if (collectibles.length === 1) {
          goBack()
        }
        showSnackbar('Collectible hidden')
      } else {
        showSnackbar('Collectible unhidden')
      }
    }
  }, [collectible?.localId, collectibles.length, dispatch, isVisible, goBack])

  const ACTION_BUTTONS: ActionButton[] = useMemo(() => {
    const visibilityAction: ActionButton = {
      title: isVisible ? ActionButtonTitle.Hide : ActionButtonTitle.Unhide,
      icon: isVisible ? 'hide' : 'show',
      onPress: toggleHidden
    }

    return [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: noop },
      visibilityAction
    ]
  }, [isVisible, toggleHidden])

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
            {collectible?.chainId &&
            isAvalancheCChainId(collectible?.chainId) ? (
              <Button
                disabled={isRefreshing}
                type="secondary"
                size="large"
                onPress={handleRefresh}>
                Refresh
              </Button>
            ) : null}
            <Button type="secondary" size="large">
              Set as my avatar
            </Button>
          </View>
        </LinearGradientBottomWrapper>
      </View>
    </View>
  )
}
