import { GroupList, GroupListItem, Text, useTheme } from '@avalabs/k2-alpine'
import React, { ReactNode, useCallback } from 'react'
import { View } from 'react-native'
import { ActionSheet } from 'common/components/ActionSheet'
import { Logo } from 'common/components/Logo'
import { router } from 'expo-router'
import { WatchAssetParams } from 'services/walletconnectv2/walletConnectCache/types'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { useDappConnectionV2 } from 'hooks/useDappConnectionV2'

const LOGO_SIZE = 64
const OVERLAP = 20

const WatchAssetScreen = ({
  params: { request, token }
}: {
  params: WatchAssetParams
}): ReactNode => {
  const { onUserApproved: onApprove, onUserRejected: onReject } =
    useDappConnectionV2()
  const {
    theme: { colors }
  } = useTheme()

  const rejectAndClose = useCallback(() => {
    onReject(request)
    router.canGoBack() && router.back()
  }, [onReject, request])

  const approve = useCallback((): void => {
    onApprove(request, { token })
    router.canGoBack() && router.back()
  }, [onApprove, request, token])

  const dappIconUri = request.peerMeta.icons?.[0]

  const data: GroupListItem[] = [
    { title: 'Token address', subtitle: token.address },
    { title: 'Token symbol', subtitle: token.symbol },
    { title: 'Decimals', subtitle: token.decimals.toString() }
  ]

  return (
    <ActionSheet
      isModal
      onClose={() => onReject(request)}
      confirm={{ label: 'Add token', onPress: approve }}
      cancel={{ label: 'Reject', onPress: rejectAndClose }}>
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 36
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Logo
            logoUri={dappIconUri}
            size={LOGO_SIZE}
            borderRadius={LOGO_SIZE}
            borderColor={colors.$borderPrimary}
            backgroundColor={colors.$white}
          />
          <View
            style={{
              marginLeft: -OVERLAP,
              borderRadius: LOGO_SIZE,
              borderWidth: 2,
              borderColor: colors.$white,
              backgroundColor: colors.$white
            }}>
            <Logo
              logoUri={token.logoUri}
              size={LOGO_SIZE}
              borderRadius={LOGO_SIZE}
              backgroundColor={colors.$white}
            />
          </View>
        </View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 21
          }}>
          <Text
            variant="body1"
            sx={{
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 20,
              fontFamily: 'Inter-Medium',
              color: '$textPrimary'
            }}>
            {request.peerMeta.name} is requesting to add this token
          </Text>
        </View>
      </View>
      <GroupList
        data={data}
        titleSx={{ fontSize: 15, color: '$textPrimary' }}
        subtitleSx={{
          fontSize: 15,
          fontFamily: 'Inter-Regular',
          marginTop: 4,
          color: '$textSecondary'
        }}
      />
    </ActionSheet>
  )
}

export default withWalletConnectCache('watchAssetParams')(WatchAssetScreen)
