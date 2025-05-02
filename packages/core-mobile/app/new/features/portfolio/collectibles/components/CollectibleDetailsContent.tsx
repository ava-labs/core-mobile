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
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { useAvatar } from 'common/hooks/useAvatar'
import { showSnackbar } from 'common/utils/toast'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { selectSelectedAvatar } from 'store/settings/avatar'
import { truncateAddress } from 'utils/Utils'
import { isAddress } from 'viem'
import { useRouter } from 'expo-router'
import { useSendSelectedToken } from 'features/send/store'
import { NftContentType } from 'store/nft'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { useCollectiblesContext } from '../CollectiblesContext'
import { HORIZONTAL_MARGIN } from '../consts'

export const CollectibleDetailsContent = ({
  collectible,
  isVisible,
  onHide
}: {
  collectible: NftItem | undefined
  isVisible: boolean
  onHide: () => void
}): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const avatar = useSelector(selectSelectedAvatar)
  const { navigate } = useRouter()
  const insets = useSafeAreaInsets()
  const networks = useNetworks()
  const { refreshMetadata, isCollectibleRefreshing } = useCollectiblesContext()
  const { saveExternalAvatar } = useAvatar()

  const isSupportedAvatar =
    collectible?.imageData?.type !== NftContentType.MP4 &&
    collectible?.imageData?.type !== NftContentType.Unknown &&
    collectible?.imageData?.image !== undefined

  const handleSaveAvatar = (): void => {
    if (!collectible?.imageData?.image) return
    saveExternalAvatar(collectible.localId, collectible.imageData.image)
    showSnackbar('Avatar saved')
  }
  const [_, setSelectedToken] = useSendSelectedToken()

  const attributes: GroupListItem[] = useMemo(() => {
    if (
      collectible?.processedMetadata?.attributes === undefined ||
      collectible?.processedMetadata?.attributes.length === 0
    )
      return []

    if (Array.isArray(collectible.processedMetadata.attributes)) {
      return collectible.processedMetadata.attributes
        .map(item => {
          if (item.trait_type.length === 0 && item.value.length === 0) {
            return
          }
          return {
            title: item.trait_type
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, function (str) {
                return str.toUpperCase().trim()
              }),
            value:
              item.display_type === 'date'
                ? getDateInMmmDdYyyyHhMmA(Number(item.value))
                : item.value
          }
        })
        .filter(item => item !== undefined)
    }

    if (typeof collectible.processedMetadata.attributes === 'object') {
      return Object.entries(collectible.processedMetadata.attributes).reduce(
        (acc, [key, value]) => {
          const stringValue = value as unknown as string
          if (key.length === 0 && stringValue.length === 0) {
            return acc
          }
          acc.push({
            title: key,
            value: stringValue
          })
          return acc
        },
        [] as GroupListItem[]
      )
    }
    return []
  }, [collectible?.processedMetadata?.attributes])

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

    await refreshMetadata(collectible, collectible.networkChainId)
  }, [canRefreshMetadata, collectible, refreshMetadata])

  const handleSend = useCallback(() => {
    setSelectedToken(collectible)
    // @ts-ignore TODO: make routes typesafe
    navigate('/collectibleSend')
  }, [collectible, navigate, setSelectedToken])

  const ACTION_BUTTONS: ActionButton[] = useMemo(() => {
    const visibilityAction: ActionButton = {
      title: isVisible ? ActionButtonTitle.Hide : ActionButtonTitle.Unhide,
      icon: isVisible ? 'hide' : 'show',
      onPress: onHide
    }

    return [
      { title: ActionButtonTitle.Send, icon: 'send', onPress: handleSend },
      visibilityAction
    ]
  }, [isVisible, onHide, handleSend])

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
            valueSx={{
              fontFamily: 'DejaVuSansMono'
            }}
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
                  networks.getNetwork(collectible?.networkChainId)?.chainName ||
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
            {collectible?.networkChainId &&
            isAvalancheCChainId(collectible?.networkChainId) ? (
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
            {collectible?.status === NftLocalStatus.Processed &&
              isSupportedAvatar && (
                <Button
                  type="secondary"
                  size="large"
                  onPress={handleSaveAvatar}
                  disabled={avatar.id === collectible?.localId}>
                  Set as my avatar
                </Button>
              )}
          </View>
        </LinearGradientBottomWrapper>
      </View>
    </View>
  )
}
