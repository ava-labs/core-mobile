import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
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
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useDeposits } from 'hooks/earn/useDeposits'
import { DefiMarket, MarketNames } from '../../types'
import { DefiMarketAssetLogo } from '../../components/DefiMarketAssetLogo'
import { useBorrowProtocol } from '../../hooks/useBorrowProtocol'
import errorIcon from '../../../../assets/icons/melting_face.png'

// Local selection state for which deposits to use as collateral
type CollateralSelection = Record<string, boolean>

const PROTOCOL_DISPLAY_NAMES: Record<string, string> = {
  [MarketNames.aave]: 'AAVE',
  [MarketNames.benqi]: 'Benqi'
}

export const SelectCollateralScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { selectedProtocol } = useBorrowProtocol()
  const { deposits, isLoading, refresh, isRefreshing } = useDeposits()

  // Filter deposits by selected protocol and only show assets that can be used as collateral
  const filteredDeposits = useMemo(() => {
    return deposits.filter(
      deposit =>
        deposit.marketName === selectedProtocol && deposit.canBeUsedAsCollateral
    )
  }, [deposits, selectedProtocol])

  // Local state to track which deposits user wants to use as collateral
  // This is NOT an on-chain setting, just a filter for the next screen
  const [collateralSelection, setCollateralSelection] =
    useState<CollateralSelection>({})

  // Initialize: select all deposits by default
  useEffect(() => {
    if (filteredDeposits.length > 0) {
      setCollateralSelection(prev => {
        const newState = { ...prev }
        filteredDeposits.forEach(deposit => {
          // Only set if not already set (preserve user's changes)
          if (newState[deposit.uniqueMarketId] === undefined) {
            newState[deposit.uniqueMarketId] = true
          }
        })
        return newState
      })
    }
  }, [filteredDeposits])

  const handleToggleCollateral = useCallback(
    (uniqueMarketId: string, value: boolean) => {
      setCollateralSelection(prev => ({
        ...prev,
        [uniqueMarketId]: value
      }))
    },
    []
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

  const handleDepositMoreAssets = useCallback(() => {
    // Dismiss borrow modal and navigate to deposit
    navigation.getParent()?.goBack()
    // Navigate to deposit flow
    // @ts-ignore TODO: make routes typesafe
    navigate('/deposit/onboarding')
  }, [navigation, navigate])

  const hasSelectedCollateral = useMemo(() => {
    // Check if any deposit is selected
    return filteredDeposits.some(
      deposit => collateralSelection[deposit.uniqueMarketId] ?? true
    )
  }, [filteredDeposits, collateralSelection])

  const renderItem = useCallback(
    ({ item }: { item: DefiMarket }) => {
      const isSelected = collateralSelection[item.uniqueMarketId] ?? true
      const balanceValue = item.asset.mintTokenBalance.balanceValue.value

      return (
        <TouchableOpacity
          onPress={() =>
            handleToggleCollateral(item.uniqueMarketId, !isSelected)
          }>
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
              <Toggle
                value={isSelected}
                onValueChange={value =>
                  handleToggleCollateral(item.uniqueMarketId, value)
                }
              />
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [collateralSelection, theme.colors, formatCurrency, handleToggleCollateral]
  )

  const renderEmpty = useCallback(() => {
    if (isLoading) {
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
  }, [isLoading])

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
