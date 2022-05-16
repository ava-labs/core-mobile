import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG'
import AvaButton from 'components/AvaButton'
import TokenDropDown from 'screens/swap/components/TokenDropDown'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { useSwapContext } from 'contexts/SwapContext'
import { useNavigation } from '@react-navigation/native'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import AppNavigation from 'navigation/AppNavigation'
import { SwapScreenProps } from 'navigation/types'

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Swap
>['navigation']

export default function SwapView() {
  const { theme } = useApplicationContext()
  const { swapFromTo, swapFrom, swapTo, error } = useSwapContext()
  const { navigate } = useNavigation<NavigationProp>()

  const reviewButtonDisabled = !swapTo.amount || !swapFrom.amount

  const confirm = () => {
    navigate(AppNavigation.Swap.Review)
  }

  const onOpenSelectToken = (
    onTokenSelected: (token: TokenWithBalance) => void
  ) => {
    navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        onTokenSelected(token)
      }
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Swap
        </AvaText.LargeTitleBold>
        <>
          <Space y={20} />
          <TokenDropDown
            type={'From'}
            error={error}
            onOpenSelectToken={onOpenSelectToken}
          />
          <Space y={20} />
          <AvaButton.Base
            onPress={swapFromTo}
            style={{
              alignSelf: 'flex-end',
              borderRadius: 50,
              backgroundColor: theme.colorBg2,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginHorizontal: 16
            }}>
            <SwapNarrowSVG />
          </AvaButton.Base>
          <TokenDropDown type={'To'} onOpenSelectToken={onOpenSelectToken} />
          <SwapTransactionDetail />
        </>
      </ScrollView>
      <AvaButton.PrimaryLarge
        style={{ margin: 16 }}
        onPress={confirm}
        disabled={reviewButtonDisabled}>
        Review Order
      </AvaButton.PrimaryLarge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
