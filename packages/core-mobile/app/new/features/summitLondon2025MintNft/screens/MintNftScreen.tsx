import {
  ActivityIndicator,
  Button,
  Image,
  showAlert,
  Text,
  useBlurBackgroundColor,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import Animated, { useSharedValue, withTiming } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import Logger from 'utils/Logger'
import { useConfetti } from 'common/contexts/ConfettiContext'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { MintNftService } from '../service/MintNftService'

export const MintNftScreen = (): ReactNode => {
  const { theme } = useTheme()
  const { back } = useRouter()
  const [parentWidth, setParentWidth] = useState(0)
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const cChainNetwork = useCChainNetwork()
  const provider = useEVMProvider(cChainNetwork)
  const [isMinting, setIsMinting] = useState(false)
  const confetti = useConfetti()
  const { request } = useInAppRequest()

  const handleSuccess = useCallback(() => {
    back()

    confetti.restart()
  }, [back, confetti])

  const handleMintNft = useCallback(async () => {
    if (!address || !provider) return

    try {
      setIsMinting(true)
      await MintNftService.mint({
        request,
        address,
        provider,
        isTestnet: isDeveloperMode
      })

      handleSuccess()
    } catch (error) {
      Logger.error('failed to mint NFT', error)
      if (isUserRejectedError(error)) {
        return
      }
      showAlert({
        title: 'Error',
        description: 'Failed to mint NFT',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setIsMinting(false)
            }
          }
        ]
      })
    } finally {
      setIsMinting(false)
    }
  }, [address, provider, request, isDeveloperMode, handleSuccess])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 16 }}>
        <Button
          testID="manually_create_new_wallet_button"
          type="primary"
          size="large"
          disabled={isMinting}
          onPress={handleMintNft}>
          {isMinting ? <ActivityIndicator /> : 'Mint'}
        </Button>
        <Button
          testID="accessExistingWallet"
          type="tertiary"
          size="large"
          disabled={isMinting}
          onPress={back}>
          Cancel
        </Button>
      </View>
    )
  }, [handleMintNft, back, isMinting])

  const blurBackgroundColor = useBlurBackgroundColor(
    theme.colors.$surfacePrimary
  )

  const renderBlur = (imageWidth: number): JSX.Element | undefined => {
    if (Platform.OS === 'android') {
      return undefined
    }

    return (
      <View
        sx={{
          backgroundColor: blurBackgroundColor,
          position: 'absolute',
          top: -BLURAREA_INSET + 10,
          left: -BLURAREA_INSET,
          right: 0,
          bottom: 0,
          width: imageWidth + BLURAREA_INSET * 2,
          height: imageWidth + BLURAREA_INSET * 2,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Image
          source={IMAGE_SOURCE}
          resizeMode="contain"
          sx={{
            width: imageWidth,
            height: imageWidth
          }}
        />
        <BlurView
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden'
          }}
          tint={theme.isDark ? 'dark' : 'light'}
          intensity={75}
          experimentalBlurMethod="dimezisBlurView"
        />
      </View>
    )
  }

  const imageWidth = Math.min(parentWidth - 32, IMAGE_SIZE)

  const opacity = useSharedValue(0)

  useEffect(() => {
    if (parentWidth > 0) {
      opacity.value = withTiming(1, { duration: 600 })
    }
  }, [parentWidth, opacity])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{
        flex: 1,
        padding: 16
      }}>
      <Animated.View
        style={[{ flex: 1, alignItems: 'center', opacity: opacity }]}
        onLayout={e => setParentWidth(e.nativeEvent.layout.width)}>
        <View
          sx={{
            marginTop: 16,
            width: imageWidth,
            aspectRatio: 1
          }}>
          {renderBlur(imageWidth)}
          <Image
            source={IMAGE_SOURCE}
            resizeMode="contain"
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: 16
            }}
          />
        </View>
        <View
          sx={{
            marginTop: 34,
            maxWidth: TEXT_WIDTH,
            gap: 10
          }}>
          <Text variant="heading3" sx={{ textAlign: 'center' }}>
            Avalanche Summit London 2025 NFT Mint
          </Text>
          <Text variant="body1" sx={{ textAlign: 'center' }}>
            Mint an exclusive Avalanche Summit London NFT redeemable for free
            coffee add ons
          </Text>
        </View>
      </Animated.View>
    </ScrollScreen>
  )
}

const IMAGE_SOURCE = require('../../../assets/summitLondon2025.png')
const IMAGE_SIZE = 300
const TEXT_WIDTH = 320
const BLURAREA_INSET = 80
