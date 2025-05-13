import React, { useCallback, useEffect, useState } from 'react'
import { Sheet } from 'components/Sheet'
import { useNavigation } from '@react-navigation/native'
import {
  ActivityIndicator,
  Button,
  Image,
  ScrollView,
  Text,
  View
} from '@avalabs/k2-mobile'
import { selectActiveAccount } from 'store/account'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsDeveloperMode,
  toggleDeveloperMode
} from 'store/settings/advanced'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useEVMProvider } from 'hooks/networks/networkProviderHooks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import Logger from 'utils/Logger'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { Alert } from 'react-native'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { MintNftService } from './MintNftService'

export const MintNftScreen = (): JSX.Element => {
  const { navigate, goBack } = useNavigation<NavigationProp>()
  const activeAccount = useSelector(selectActiveAccount)
  const address = activeAccount?.addressC
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const cChainNetwork = useCChainNetwork()
  const provider = useEVMProvider(cChainNetwork)
  const [isMinting, setIsMinting] = useState(false)
  const { request } = useInAppRequest()
  const dispatch = useDispatch()

  const handleSuccess = useCallback(() => {
    goBack()
    navigate(AppNavigation.Portfolio.Portfolio, { tabIndex: 1 })
  }, [goBack, navigate])

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
      Alert.alert('Error', 'Failed to mint NFT', [
        {
          text: 'OK'
        }
      ])
    } finally {
      setIsMinting(false)
    }
  }, [address, provider, request, isDeveloperMode, handleSuccess])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 16, padding: 16 }}>
        <Button
          type="primary"
          size="large"
          disabled={isMinting || isDeveloperMode}
          onPress={handleMintNft}>
          {isMinting ? (
            <ActivityIndicator sx={{ alignSelf: 'center' }} />
          ) : (
            'Mint'
          )}
        </Button>
        <Button
          type="tertiary"
          size="large"
          disabled={isMinting}
          onPress={goBack}>
          Cancel
        </Button>
      </View>
    )
  }, [handleMintNft, goBack, isMinting, isDeveloperMode])

  useEffect(() => {
    if (isDeveloperMode) {
      dispatch(toggleDeveloperMode())
    }
  }, [isDeveloperMode, dispatch])

  return (
    <Sheet>
      <ScrollView
        sx={{ flex: 1 }}
        contentContainerSx={{ alignItems: 'center' }}>
        <Image
          source={IMAGE_SOURCE}
          resizeMode="contain"
          sx={{
            marginTop: 48,
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            borderRadius: 16
          }}
        />
        <View
          sx={{
            marginTop: 34,
            maxWidth: TEXT_WIDTH,
            gap: 10
          }}>
          <Text variant="heading4" sx={{ textAlign: 'center' }}>
            Avalanche Summit London 2025 NFT Mint
          </Text>
          <Text variant="body2" sx={{ textAlign: 'center' }}>
            Mint an exclusive Avalanche Summit London NFT redeemable for free
            coffee add ons
          </Text>
        </View>
      </ScrollView>
      {renderFooter()}
    </Sheet>
  )
}

const IMAGE_SOURCE = require('assets/summitLondon2025.png')
const IMAGE_SIZE = 300
const TEXT_WIDTH = 320

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']
