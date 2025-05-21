import {
  Button,
  Icons,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'
import React, { useCallback, useLayoutEffect } from 'react'
import useAddCustomToken from 'common/hooks/useAddCustomToken'
import { LocalTokenWithBalance } from 'store/balance'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TokenLogo } from 'common/components/TokenLogo'
import { TextInput } from 'react-native'
import { useSelectedNetwork } from '../store'

export const AddCustomTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [selectedNetwork, setSelectedNetwork] = useSelectedNetwork()
  const { canGoBack, back, navigate } = useRouter()

  const showSuccess = useCallback(() => {
    showSnackbar('Added!')
    setSelectedNetwork(undefined)
    canGoBack() && back()
  }, [setSelectedNetwork, canGoBack, back])

  const {
    tokenAddress,
    setTokenAddress,
    errorMessage,
    token,
    addCustomToken,
    isLoading
  } = useAddCustomToken(showSuccess)

  // only enable button if we have token and no error message
  const disabled = !!(errorMessage || !token || isLoading)

  // reset token address and network
  const reset = useCallback(() => {
    setTokenAddress('')
    setSelectedNetwork(undefined)
  }, [setTokenAddress, setSelectedNetwork])

  useLayoutEffect(() => {
    reset()
  }, [reset])

  const goToScanQrCode = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/tokenManagement/scanQrCode')
  }, [navigate])

  const goToSelectNetwork = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/selectCustomTokenNetwork')
  }, [navigate])

  const renderToken = useCallback((): JSX.Element | undefined => {
    if (isLoading) {
      return <LoadingState sx={{ flex: 1 }} />
    }

    if (!token) {
      return undefined
    }

    return (
      <View sx={{ marginTop: 32 }}>
        <View
          style={{ justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <LogoWithNetwork
            token={token as LocalTokenWithBalance}
            outerBorderColor={colors.$surfacePrimary}
          />
          <Text variant="heading6">{token.name}</Text>
        </View>
        <Button
          disabled={disabled}
          size="large"
          type="primary"
          style={{ margin: 16 }}
          onPress={addCustomToken}>
          Add
        </Button>
      </View>
    )
  }, [token, colors.$surfacePrimary, addCustomToken, disabled, isLoading])

  const renderTokenAddress = useCallback(() => {
    return (
      <>
        <View
          sx={{
            backgroundColor: colors.$surfaceSecondary,
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}>
          <View sx={{ width: '90%' }}>
            <Text
              variant="body2"
              sx={{
                fontSize: 11,
                lineHeight: 14,
                color: colors.$textSecondary
              }}>
              Token contract address
            </Text>
            <TextInput
              onChangeText={setTokenAddress}
              numberOfLines={2}
              multiline
              value={tokenAddress}
              style={{
                color: colors.$textPrimary,
                fontSize: 15,
                lineHeight: 20
              }}
            />
          </View>
          <TouchableOpacity onPress={goToScanQrCode} hitSlop={16}>
            <Icons.Custom.QRCodeScanner
              color={colors.$textPrimary}
              width={20}
              height={20}
            />
          </TouchableOpacity>
        </View>

        {errorMessage.length > 0 && (
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <Icons.Action.Info color={colors.$textDanger} />
            <Text
              variant="subtitle1"
              sx={{ color: colors.$textDanger, marginLeft: 8 }}>
              {errorMessage}
            </Text>
          </View>
        )}
      </>
    )
  }, [
    colors.$surfaceSecondary,
    colors.$textSecondary,
    colors.$textPrimary,
    colors.$textDanger,
    setTokenAddress,
    tokenAddress,
    goToScanQrCode,
    errorMessage
  ])

  const renderNetwork = useCallback((): JSX.Element => {
    return (
      <TouchableOpacity
        onPress={goToSelectNetwork}
        sx={{
          backgroundColor: colors.$surfaceSecondary,
          paddingHorizontal: 16,
          paddingVertical: 10,
          justifyContent: 'space-between',
          flexDirection: 'row',
          borderRadius: 12,
          alignItems: 'center'
        }}>
        <Text variant="body2" sx={{ fontSize: 16, lineHeight: 22 }}>
          Network
        </Text>
        {selectedNetwork ? (
          <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TokenLogo logoUri={selectedNetwork.logoUri} size={24} />
            <Text
              variant="body2"
              sx={{
                fontSize: 16,
                lineHeight: 22,
                color: colors.$textSecondary
              }}>
              {selectedNetwork.chainName}
            </Text>
            <View sx={{ marginHorizontal: 8 }}>
              <Icons.Navigation.ChevronRightV2 color={colors.$textSecondary} />
            </View>
          </View>
        ) : (
          <View sx={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text
              variant="body2"
              sx={{
                fontSize: 16,
                lineHeight: 22,
                color: colors.$textSecondary
              }}>
              Select
            </Text>
            <View sx={{ marginHorizontal: 8 }}>
              <Icons.Navigation.ChevronRightV2 color={colors.$textSecondary} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }, [
    colors.$surfaceSecondary,
    colors.$textSecondary,
    goToSelectNetwork,
    selectedNetwork
  ])

  return (
    <ScrollScreen
      title={`Add a custom\ntoken`}
      contentContainerStyle={{ padding: 16 }}
      shouldAvoidKeyboard
      isModal>
      <View sx={{ gap: 10, marginTop: 24 }}>
        {renderNetwork()}
        {selectedNetwork && renderTokenAddress()}
        {renderToken()}
      </View>
    </ScrollScreen>
  )
}
