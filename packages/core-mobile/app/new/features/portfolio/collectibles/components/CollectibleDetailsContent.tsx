import {
  ActivityIndicator,
  alpha,
  Button,
  GroupList,
  GroupListItem,
  ScrollView,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { NftItem } from 'services/nft/types'

import { noop } from '@avalabs/core-utils-sdk'
import { useNavigation } from '@react-navigation/native'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { showSnackbar } from 'common/utils/toast'
import { LinearGradient } from 'expo-linear-gradient'
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
import { truncateAddress } from 'utils/Utils'
import { isAddress } from 'viem'
import { useCollectiblesContext } from '../CollectiblesContext'
import { HORIZONTAL_MARGIN } from '../consts'

export const CollectibleDetailsContent = ({
  collectible,
  collectibles
}: {
  collectible: NftItem | undefined
  collectibles: NftItem[]
}): ReactNode => {
  const dispatch = useDispatch()
  const {
    theme: { colors }
  } = useTheme()
  const insets = useSafeAreaInsets()
  const networks = useNetworks()
  const { goBack } = useNavigation()
  const { refreshMetadata, isCollectibleRefreshing } = useCollectiblesContext()

  const collectibleVisibility = useSelector(selectCollectibleVisibility)
  const isVisible = collectible
    ? isCollectibleVisible(collectibleVisibility, collectible)
    : false

  const attributes: GroupListItem[] = useMemo(
    () =>
      collectible?.processedMetadata?.attributes?.map(item => ({
        title: item.trait_type
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, function (str) {
            return str.toUpperCase().trim()
          }),
        value: item.value
      })) || [],
    [collectible?.processedMetadata?.attributes]
  )

  const createdBy = useMemo(() => {
    return collectible?.address
      ? isAddress(collectible?.address)
        ? truncateAddress(collectible?.address)
        : collectible?.address
      : 'Unknown'
  }, [collectible?.address])

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
        flex: 1,
        overflow: 'hidden'
      }}>
      <View
        sx={{
          alignItems: 'center',
          zIndex: 10,
          backgroundColor: '$surfacePrimary'
        }}>
        <ActionButtons buttons={ACTION_BUTTONS} />
      </View>

      <View
        style={{
          position: 'relative',
          flex: 1
        }}>
        <LinearGradient
          colors={[
            alpha(colors.$surfacePrimary, 1),
            alpha(colors.$surfacePrimary, 0)
          ]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            zIndex: 10
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_MARGIN,
            gap: 12,
            paddingBottom: 150 + insets.bottom,
            paddingTop: 20
          }}>
          <GroupList
            data={[
              {
                title: `Created by`,
                value: createdBy
              }
            ]}
          />

          <GroupList
            data={[
              {
                title: `Standard`,
                value: collectible?.type
              },
              {
                title: `Chain`,
                value:
                  networks.getNetwork(collectible?.chainId)?.chainName ||
                  'Unknown network'
              }
            ]}
          />

          <GroupList data={attributes} />
        </ScrollView>
      </View>

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
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={colors.$textPrimary} />
                ) : (
                  'Refresh'
                )}
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
