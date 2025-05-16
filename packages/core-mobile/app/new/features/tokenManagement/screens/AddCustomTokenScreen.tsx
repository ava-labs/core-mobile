import {
  Button,
  Icons,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'
import React, { useCallback } from 'react'
import useAddCustomToken from 'common/hooks/useAddCustomToken'
import { LocalTokenWithBalance } from 'store/balance'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useNetwork } from '../store'

export const AddCustomTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [network] = useNetwork()
  const { canGoBack, back, navigate } = useRouter()

  const showSuccess = useCallback(() => {
    showSnackbar('Added!')
    canGoBack() && back()
  }, [canGoBack, back])

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

  const goToScanQrCode = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/tokenManagement/scanQrCode')
  }, [navigate])

  const goToSelectNetwork = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/tokenManagement/selectNetwork')
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

  const renderHeader = useCallback(() => {
    return (
      <SearchBar
        onTextChanged={setTokenAddress}
        searchText={tokenAddress}
        placeholder="Token contract address"
        rightComponent={
          <TouchableOpacity
            onPress={goToScanQrCode}
            hitSlop={16}
            sx={{
              marginRight: 9,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Icons.Custom.QRCodeScanner
              color={colors.$textSecondary}
              width={20}
              height={20}
            />
          </TouchableOpacity>
        }
      />
    )
  }, [setTokenAddress, tokenAddress, goToScanQrCode, colors.$textSecondary])

  const renderFooter = useCallback(() => {
    return (
      <Button
        type="primary"
        size="medium"
        disabled={token !== undefined}
        onPress={goToSelectNetwork}>
        {network?.chainName ?? 'Select a network'}
      </Button>
    )
  }, [goToSelectNetwork, network?.chainName, token])

  return (
    <ScrollScreen
      title="Add a custom token"
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}
      shouldAvoidKeyboard
      isModal>
      <Text
        variant="subtitle1"
        sx={{ color: colors.$textDanger, marginTop: 8, marginLeft: 8 }}>
        {errorMessage}
      </Text>

      {renderToken()}
    </ScrollScreen>
  )
}
