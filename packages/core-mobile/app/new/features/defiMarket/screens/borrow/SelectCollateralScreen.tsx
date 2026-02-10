import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Button,
  Image,
  Separator,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { Address } from 'viem'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useDeposits } from 'hooks/earn/useDeposits'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheEvmProvider } from 'hooks/networks/networkProviderHooks'
import Logger from 'utils/Logger'
import { DefiMarket, MarketNames } from '../../types'
import { DefiMarketAssetLogo } from '../../components/DefiMarketAssetLogo'
import { useBorrowProtocol } from '../../hooks/useBorrowProtocol'
import { useAaveSetCollateral } from '../../hooks/aave/useAaveSetCollateral'
import { useBenqiSetCollateral } from '../../hooks/benqi/useBenqiSetCollateral'
import {
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  PROTOCOL_DISPLAY_NAMES
} from '../../consts'
import { useRedirectToBorrowAfterDeposit } from '../../store'
import errorIcon from '../../../../assets/icons/melting_face.png'

// Track which items are currently being toggled (transaction in progress)
type TogglingState = Record<string, boolean>

export const SelectCollateralScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { selectedProtocol } = useBorrowProtocol()
  const { deposits, isLoading, isFetching, refresh, isRefreshing } =
    useDeposits()
  const network = useCChainNetwork()
  const provider = useAvalancheEvmProvider()

  // Track which items are currently being toggled (transaction in progress)
  const [togglingState, setTogglingState] = useState<TogglingState>({})

  // Callback when transaction is settled (confirmed or failed)
  const handleTransactionSettled = useCallback((requestId?: string) => {
    if (requestId) {
      setTogglingState(prev => ({
        ...prev,
        [requestId]: false
      }))
    }
  }, [])

  // Initialize hooks for both protocols with shared onSettled callback
  const { setCollateral: setAaveCollateral } = useAaveSetCollateral({
    network,
    provider,
    onSettled: handleTransactionSettled
  })
  const { setCollateral: setBenqiCollateral } = useBenqiSetCollateral({
    network,
    provider,
    onSettled: handleTransactionSettled
  })

  // Filter deposits by selected protocol and only show assets that can be used as collateral
  const filteredDeposits = useMemo(() => {
    return deposits.filter(
      deposit =>
        deposit.marketName === selectedProtocol && deposit.canBeUsedAsCollateral
    )
  }, [deposits, selectedProtocol])

  const handleToggleCollateral = useCallback(
    async (deposit: DefiMarket, newValue: boolean) => {
      const requestId = deposit.uniqueMarketId

      // Mark this item as toggling
      setTogglingState(prev => ({
        ...prev,
        [requestId]: true
      }))

      try {
        if (deposit.marketName === MarketNames.aave) {
          // Use WAVAX address for AVAX (native token has no contract address)
          const assetAddress =
            deposit.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
          await setAaveCollateral({
            assetAddress: assetAddress as Address,
            useAsCollateral: newValue,
            requestId
          })
        } else if (deposit.marketName === MarketNames.benqi) {
          // For Benqi, use qToken address (mintTokenAddress)
          await setBenqiCollateral({
            qTokenAddress: deposit.asset.mintTokenAddress,
            useAsCollateral: newValue,
            requestId
          })
        }
        // The cache will be invalidated by the hook, which will cause a refetch
        // Loading state will be cleared by onSettled callback after transaction is confirmed
      } catch (error) {
        Logger.error('Failed to set collateral', error)
        // Clear toggling state on error (transaction submission failed)
        setTogglingState(prev => ({
          ...prev,
          [requestId]: false
        }))
      }
    },
    [setAaveCollateral, setBenqiCollateral]
  )

  const handlePressNext = useCallback(() => {
    // TODO: Get selected collateral IDs and pass to next screen via route params or state
    // const selectedCollateralIds = filteredDeposits
    //   .filter(deposit => {
    //     if (!deposit.canBeUsedAsCollateral) return false
    //     return collateralSelection[deposit.uniqueMarketId] ?? true
    //   })
    //   .map(deposit => deposit.uniqueMarketId)

    // @ts-ignore TODO: make routes typesafe
    navigate('/borrow/selectAsset')
  }, [navigate])

  const [, setRedirectToBorrow] = useRedirectToBorrowAfterDeposit()

  const handleDepositMoreAssets = useCallback(() => {
    // Set flag to redirect back to borrow after deposit completes
    setRedirectToBorrow(true)
    // Dismiss borrow modal and navigate to deposit
    navigation.getParent()?.goBack()
    // Navigate to deposit flow, skip onboarding
    // @ts-ignore TODO: make routes typesafe
    navigate('/deposit/selectAsset')
  }, [navigation, navigate, setRedirectToBorrow])

  const hasSelectedCollateral = useMemo(() => {
    // Check if any deposit has collateral enabled on-chain
    return filteredDeposits.some(
      deposit => deposit.usageAsCollateralEnabledOnUser === true
    )
  }, [filteredDeposits])

  const renderItem = useCallback(
    ({ item }: { item: DefiMarket }) => {
      // Use on-chain collateral status
      const isEnabled = item.usageAsCollateralEnabledOnUser ?? false
      const isToggling = togglingState[item.uniqueMarketId] ?? false
      const balanceValue = item.asset.mintTokenBalance.balanceValue.value
      // Both AAVE and Benqi support on-chain toggle
      const canToggle = !isToggling

      return (
        <TouchableOpacity
          disabled={!canToggle}
          onPress={() => handleToggleCollateral(item, !isEnabled)}>
          <View
            sx={{
              marginHorizontal: 16,
              marginTop: 10,
              backgroundColor: theme.colors.$surfaceSecondary,
              borderRadius: 18,
              overflow: 'hidden'
            }}>
            <View
              sx={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12
              }}>
              <DefiMarketAssetLogo
                market={item}
                logoWidth={36}
                networkLogoWidth={16}
                overwrappingWidth={10}
              />
              <View sx={{ flex: 1 }}>
                <Text
                  variant="body2"
                  sx={{ color: theme.colors.$textPrimary, fontWeight: 500 }}>
                  {item.asset.symbol} on{' '}
                  {PROTOCOL_DISPLAY_NAMES[item.marketName] ?? item.marketName}
                </Text>
                <Text
                  variant="subtitle2"
                  sx={{ color: theme.colors.$textSecondary, fontWeight: 500 }}>
                  {formatCurrency({ amount: balanceValue.toNumber() })}
                </Text>
              </View>
            </View>
            <Separator sx={{ marginHorizontal: 16 }} />
            <View
              sx={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <Text
                variant="body1"
                sx={{ color: theme.colors.$textPrimary, fontWeight: 400 }}>
                Can be used as collateral
              </Text>
              {isToggling ? (
                <ActivityIndicator size="small" />
              ) : (
                <Toggle
                  value={isEnabled}
                  disabled={!canToggle}
                  onValueChange={value => handleToggleCollateral(item, value)}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [togglingState, theme.colors, formatCurrency, handleToggleCollateral]
  )

  const renderEmpty = useCallback(() => {
    // Show loading for initial load or background refetch (but not for pull-to-refresh)
    if (isLoading || (isFetching && !isRefreshing)) {
      return <LoadingState sx={{ flex: 1 }} />
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No deposits found"
        description="Deposit assets first to use them as collateral"
      />
    )
  }, [isLoading, isFetching, isRefreshing])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 12 }}>
        <Button
          type="primary"
          size="large"
          disabled={!hasSelectedCollateral || filteredDeposits.length === 0}
          onPress={handlePressNext}>
          Next
        </Button>
        <Button type="secondary" size="large" onPress={handleDepositMoreAssets}>
          Deposit more assets
        </Button>
      </View>
    )
  }, [
    hasSelectedCollateral,
    filteredDeposits.length,
    handlePressNext,
    handleDepositMoreAssets
  ])

  return (
    <ListScreen
      title="Select deposits to use as collateral"
      isModal
      data={filteredDeposits}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      renderFooter={renderFooter}
      keyExtractor={item => item.uniqueMarketId}
      onRefresh={refresh}
      refreshing={isRefreshing}
    />
  )
}
