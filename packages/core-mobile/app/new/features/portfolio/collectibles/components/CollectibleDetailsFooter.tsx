import { ActivityIndicator, Button, useTheme, View } from '@avalabs/k2-alpine'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { NftItem, NftLocalStatus } from 'services/nft/types'
import { NftContentType } from 'store/nft'
import { selectSelectedAvatar } from 'store/settings/avatar'
import { HORIZONTAL_MARGIN } from '../consts'

export const CollectibleDetailsFooter = ({
  collectible,
  isRefreshing,
  handleRefresh,
  handleSaveAvatar
}: {
  collectible: NftItem | undefined
  isRefreshing: boolean
  handleRefresh: () => void
  handleSaveAvatar: () => void
}): React.ReactNode => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const avatar = useSelector(selectSelectedAvatar)

  const isSupportedAvatar =
    collectible?.imageData?.type !== NftContentType.MP4 &&
    collectible?.imageData?.type !== NftContentType.Unknown &&
    collectible?.imageData?.image !== undefined

  return (
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
              <ActivityIndicator
                size="small"
                color={theme.colors.$textPrimary}
              />
            ) : (
              'Refresh'
            )}
          </Button>
        ) : null}
        {collectible?.status === NftLocalStatus.Processed &&
        isSupportedAvatar ? (
          <Button
            type="secondary"
            size="large"
            onPress={handleSaveAvatar}
            disabled={avatar.id === collectible?.localId}>
            Set as my avatar
          </Button>
        ) : null}
      </View>
    </LinearGradientBottomWrapper>
  )
}
