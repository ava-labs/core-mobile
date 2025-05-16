import {
  Button,
  Icons,
  IndexPath,
  SearchBar,
  SimpleDropdown,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { showSnackbar } from 'common/utils/toast'
import React, { useCallback, useState } from 'react'
import useAddCustomToken, {
  CUSTOM_TOKEN_NETWORKS
} from 'common/hooks/useAddCustomToken'
import { LocalTokenWithBalance } from 'store/balance'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'

export const AddCustomTokenScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { canGoBack, back, push } = useRouter()
  const [selectedRow, setSelectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })

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
    isLoading,
    changeNetwork
  } = useAddCustomToken(showSuccess)

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

  const renderFooter = useCallback(() => {
    return (
      <SimpleDropdown
        from={
          <Button type="primary" size="medium" disabled={token !== undefined}>
            {CUSTOM_TOKEN_NETWORKS[selectedRow.section]?.[selectedRow.row]}
          </Button>
        }
        offset={10}
        sections={CUSTOM_TOKEN_NETWORKS}
        selectedRows={[selectedRow]}
        onSelectRow={indexPath => {
          setSelectedRow(indexPath)
          const network =
            CUSTOM_TOKEN_NETWORKS?.[indexPath.section]?.[indexPath.row]
          network && changeNetwork(network)
        }}
      />
    )
  }, [changeNetwork, selectedRow, token])

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
