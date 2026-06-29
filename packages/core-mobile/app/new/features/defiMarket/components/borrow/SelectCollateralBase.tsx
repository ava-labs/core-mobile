import React, { useCallback, useMemo } from 'react'
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
import { useNavigation } from 'expo-router'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useDeposits } from 'hooks/earn/useDeposits'
import { DefiMarket, MarketName } from '../../types'
import { DefiMarketAssetLogo } from '../DefiMarketAssetLogo'
import { useSelectedBorrowProtocol } from '../../hooks/useBorrowProtocol'
import { PROTOCOL_DISPLAY_NAMES } from '../../consts'
import { useRedirectToBorrowAfterDeposit } from '../../store'
import errorIcon from '../../../../assets/icons/melting_face.png'

type TogglingState = Record<string, boolean>

export const SelectCollateralBase = ({
  protocol,
  onToggleCollateral,
  togglingState
}: {
  protocol: MarketName
  onToggleCollateral: (deposit: DefiMarket, newValue: boolean) => void
  togglingState: TogglingState
}): JSX.Element => {
  const { navigate } = useRouter()
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const [selectedProtocol] = useSelectedBorrowProtocol()
  const { deposits, isLoading, isFetching, refresh, isRefreshing } =
    useDeposits()

  const filteredDeposits = useMemo(() => {
    return deposits.filter(
      deposit =>
        deposit.marketName === protocol && deposit.canBeUsedAsCollateral
    )
  }, [deposits, protocol])

  const handlePressNext = useCallback(() => {
    navigate('/borrow/selectAsset')
  }, [navigate])

  const [, setRedirectToBorrow] = useRedirectToBorrowAfterDeposit()

  const handleDepositMoreAssets = useCallback(() => {
    setRedirectToBorrow(selectedProtocol)
    navigation.getParent()?.goBack()
    navigate('/deposit/selectAsset')
  }, [navigation, navigate, selectedProtocol, setRedirectToBorrow])

  const hasSelectedCollateral = useMemo(() => {
    return filteredDeposits.some(
      deposit => deposit.usageAsCollateralEnabledOnUser === true
    )
  }, [filteredDeposits])

  const renderItem = useCallback(
    ({ item }: { item: DefiMarket }) => {
      const isEnabled = item.usageAsCollateralEnabledOnUser ?? false
      const isToggling = togglingState[item.uniqueMarketId] ?? false
      const balanceValue = item.asset.mintTokenBalance.balanceValue.value

      return (
        <TouchableOpacity
          disabled={isToggling}
          onPress={() => onToggleCollateral(item, !isEnabled)}>
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
                  sx={{
                    color: theme.colors.$textPrimary,
                    fontFamily: 'Inter-Medium'
                  }}>
                  {item.asset.symbol} on{' '}
                  {PROTOCOL_DISPLAY_NAMES[item.marketName] ?? item.marketName}
                </Text>
                <Text
                  variant="subtitle2"
                  sx={{
                    color: theme.colors.$textSecondary,
                    fontFamily: 'Inter-Medium'
                  }}>
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
                sx={{
                  color: theme.colors.$textPrimary,
                  fontFamily: 'Inter-Regular'
                }}>
                Can be used as collateral
              </Text>
              {isToggling ? (
                <ActivityIndicator size="small" />
              ) : (
                <Toggle
                  value={isEnabled}
                  disabled={isToggling}
                  onValueChange={value => onToggleCollateral(item, value)}
                />
              )}
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [togglingState, theme.colors, formatCurrency, onToggleCollateral]
  )

  const renderEmpty = useCallback(() => {
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
          testID="next_btn"
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
