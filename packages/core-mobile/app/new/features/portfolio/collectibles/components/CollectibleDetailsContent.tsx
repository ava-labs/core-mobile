import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  alpha,
  GroupList,
  GroupListItem,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { useAvatar } from 'common/hooks/useAvatar'
import { showSnackbar } from 'common/utils/toast'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/assets/components/ActionButtons'
import { ActionButtonTitle } from 'features/portfolio/assets/consts'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { forwardRef, ReactNode, useCallback, useMemo } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NftItem } from 'services/nft/types'
import { isAddress } from 'viem'
import { useCollectiblesContext } from '../CollectiblesContext'
import { HORIZONTAL_MARGIN } from '../consts'
import { getCollectibleAttributes } from '../utils'
import { CollectibleDetailsFooter } from './CollectibleDetailsFooter'

export const CollectibleDetailsContent = forwardRef<
  ScrollView,
  {
    collectible: NftItem | undefined
    isVisible: boolean
    onHide: () => void
  }
>(({ collectible, isVisible, onHide }, ref): ReactNode => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const insets = useSafeAreaInsets()
  const networks = useNetworks()
  const { refreshMetadata, isCollectibleRefreshing } = useCollectiblesContext()
  const { saveExternalAvatar } = useAvatar()

  const handleSaveAvatar = (): void => {
    if (!collectible?.imageData?.image) return
    saveExternalAvatar(collectible.localId, collectible.imageData.image)
    showSnackbar('Avatar saved')
  }
  const [_, setSelectedToken] = useSendSelectedToken()

  const attributes: GroupListItem[] = useMemo(() => {
    return getCollectibleAttributes(collectible)
  }, [collectible])

  const createdBy = useMemo(() => {
    return collectible?.address
      ? isAddress(collectible?.address)
        ? truncateAddress(collectible?.address, TRUNCATE_ADDRESS_LENGTH)
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
          ref={ref}
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_MARGIN,
            gap: 12,
            paddingBottom: 150 + insets.bottom,
            paddingTop: 20
          }}
          bounces={false}
          showsVerticalScrollIndicator={false}>
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
        <CollectibleDetailsFooter
          collectible={collectible}
          isRefreshing={isRefreshing}
          handleRefresh={handleRefresh}
          handleSaveAvatar={handleSaveAvatar}
        />
      </View>
    </View>
  )
})
