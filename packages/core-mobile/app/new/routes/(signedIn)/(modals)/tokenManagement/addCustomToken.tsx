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
import React, { useCallback, useEffect } from 'react'
import useAddCustomToken from 'common/hooks/useAddCustomToken'
import { LocalTokenWithBalance } from 'store/balance'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'

const AddCustomTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const params = useLocalSearchParams<{ tokenAddress: string }>()
  const { canGoBack, back, push } = useRouter()

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

  useEffect(() => {
    if (params.tokenAddress) {
      setTokenAddress(params.tokenAddress)
    }
  }, [setTokenAddress, params.tokenAddress])

  // only enable button if we have token and no error message
  const disabled = !!(errorMessage || !token || isLoading)

  const goToScanQrCode = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    push('/tokenManagement/scanQrCode')
  }, [push])

  const renderToken = (): JSX.Element | undefined => {
    if (isLoading) {
      return <LoadingState sx={{ flex: 1 }} />
    }

    if (!token) {
      return undefined
    }

    return (
      <>
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
      </>
    )
  }

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

  return (
    <ScrollScreen
      title="Add a custom token"
      renderHeader={renderHeader}
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

export default AddCustomTokenScreen
