import React, { useCallback } from 'react'
import { TransactionOnboarding } from 'common/components/TransactionOnboarding'
import { GroupList, Icons, useTheme } from '@avalabs/k2-alpine'
import { ViewOnceKey } from 'store/viewOnce'
import { useRouter } from 'expo-router'

export const DepositOnboardingScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()

  const handlePressNext = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/deposit/deposit')
  }, [navigate])

  const renderFooterAccessory = useCallback(() => {
    const accessory = (
      <Icons.Navigation.Check color={theme.colors.$textSuccess} />
    )
    return (
      <GroupList
        titleSx={{ fontFamily: 'Inter-regular', fontSize: 15 }}
        data={[
          {
            title: 'Earn up to 5.78% APY', // TODO: use dynamic value for APY(Live APY)
            accessory
          },
          {
            title: 'Deposit easily and native within Core',
            accessory
          },
          {
            title: 'Assets only deposited in trusted pools',
            accessory
          },
          {
            title: 'Withdraw anytime',
            accessory
          }
        ]}
      />
    )
  }, [theme])

  return (
    <TransactionOnboarding
      icon={{ component: Icons.Custom.Psychiatry, size: 75 }}
      title={`Deposit your crypto to earn yield`}
      subtitle={`Easily earn yield by depositing crypto into lending protocols and withdraw anytime.`}
      viewOnceKey={ViewOnceKey.DEPOSIT_ONBOARDING}
      onPressNext={handlePressNext}
      footerAccessory={renderFooterAccessory()}
    />
  )
}
