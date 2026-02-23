import React, { useCallback, useMemo } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { GroupList, Icons, useTheme } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { useDeposits } from 'hooks/earn/useDeposits'
import { useBorrowProtocol } from '../../hooks/useBorrowProtocol'
import { useRedirectToBorrowAfterDeposit } from '../../store'

export const OnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { deposits, isLoading } = useDeposits()
  const { selectedProtocol } = useBorrowProtocol()
  const [, setRedirectToBorrow] = useRedirectToBorrowAfterDeposit()

  // Filter deposits by selected protocol
  const protocolDeposits = useMemo(() => {
    return deposits.filter(deposit => deposit.marketName === selectedProtocol)
  }, [deposits, selectedProtocol])

  const handlePressNext = useCallback(() => {
    if (protocolDeposits.length === 0) {
      // No deposits for selected protocol - dismiss borrow modal and navigate to deposit flow
      // Set protocol to redirect back to borrow after deposit completes
      setRedirectToBorrow(selectedProtocol)
      navigation.getParent()?.goBack()
      // @ts-ignore TODO: make routes typesafe
      navigate('/deposit/selectAsset')
    } else {
      // Has deposits - proceed to collateral selection
      // @ts-ignore TODO: make routes typesafe
      navigate('/borrow/selectCollateral')
    }
  }, [
    navigate,
    navigation,
    protocolDeposits.length,
    selectedProtocol,
    setRedirectToBorrow
  ])

  const renderFooterAccessory = useCallback(() => {
    const accessory = (
      <Icons.Navigation.Check color={theme.colors.$textSuccess} />
    )
    return (
      <GroupList
        titleSx={{ fontFamily: 'Inter-Regular', fontSize: 15 }}
        data={[
          {
            title: 'Get liquidity from your deposits',
            accessory
          },
          {
            title: 'Monitor loan health on demand',
            accessory
          },
          {
            title: 'Repay loans at anytime',
            accessory
          }
        ]}
      />
    )
  }, [theme])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.MoneyBag, size: 60 }}
      title="Borrow tokens to access liquidity"
      subtitle="Take a loan against your deposits and repay anytime"
      onPressNext={handlePressNext}
      footerAccessory={renderFooterAccessory()}
      scrollEnabled={true}
      isLoading={isLoading}
    />
  )
}
