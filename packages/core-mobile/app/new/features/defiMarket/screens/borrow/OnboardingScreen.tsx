import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { GroupList, Icons, useTheme } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'

export const OnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()

  const handlePressNext = useCallback(() => {
    // TODO: Navigate to borrow select asset flow
    // @ts-ignore TODO: make routes typesafe
    navigate('/borrow/selectAsset')
  }, [navigate])

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
    />
  )
}
