import React, { FC, useEffect, useMemo, useState } from 'react'
import { Animated, ScrollView, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaText from 'components/AvaText'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import Separator from 'components/Separator'
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails'
import { useSwapContext } from 'contexts/SwapContext'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import Loader from 'components/Loader'
import AppNavigation from 'navigation/AppNavigation'
import { SwapScreenProps } from 'navigation/types'
import { Row } from 'components/Row'
import InfoSVG from 'components/svg/InfoSVG'
import { interval, tap } from 'rxjs'
import { Popable } from 'react-native-popable'

const SECOND = 1000

type NavigationProp = SwapScreenProps<
  typeof AppNavigation.Swap.Review
>['navigation']

const SwapReview: FC = () => {
  const { swapTo, swapFrom, doSwap, refresh } = useSwapContext()
  const theme = useApplicationContext().theme
  const { goBack, navigate } = useNavigation<NavigationProp>()
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState('0s')
  const [colorAnim] = useState(new Animated.Value(1))

  const animatedColor = useMemo(() => {
    return colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.white, theme.colorPrimary1]
    })
  }, [colorAnim])

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false
    }).start(() => {
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false
      }).start()
    })
  }, [swapTo.amount, swapTo.usdValue])

  function onConfirm() {
    setLoading(true)
    doSwap()
      .then(value => {
        console.log(value)
        navigate(AppNavigation.Swap.Success)
      })
      .catch((reason: Error) => {
        console.error(reason)
        navigate(AppNavigation.Swap.Fail, { errorMsg: reason.message ?? '' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const RESET_INTERVAL = 60 // seconds
    const sub = interval(SECOND)
      .pipe(
        tap(value => {
          const number = RESET_INTERVAL - (value % RESET_INTERVAL) - 1
          setSecondsLeft(number.toString() + 's')
        }),
        tap(value => {
          if (value && value % RESET_INTERVAL === 0) {
            console.log('reset')
            refresh()
          }
        })
      )
      .subscribe()
    return () => sub.unsubscribe()
  }, [])

  return loading ? (
    <Loader />
  ) : (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Row style={{ justifyContent: 'space-between', marginHorizontal: 16 }}>
          <AvaText.LargeTitleBold>Review Order</AvaText.LargeTitleBold>
          <Popable
            content={'Quotes are refreshed to reflect current market prices'}
            position={'left'}
            style={{ minWidth: 200 }}
            backgroundColor={theme.colorBg3}>
            <Row
              style={{
                backgroundColor: theme.colorBg2,
                padding: 8,
                borderRadius: 100
              }}>
              <AvaText.ButtonSmall>{secondsLeft}</AvaText.ButtonSmall>
              <Space x={4} />
              <InfoSVG />
            </Row>
          </Popable>
        </Row>
        <Space y={20} />
        <AvaText.Heading3 textStyle={{ marginHorizontal: 16 }}>
          From
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={<Avatar.Token token={swapFrom.token!} />}
          title={swapFrom.token?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1>{swapFrom.amount.toFixed(5)}</AvaText.Body1>
              <AvaText.Body3 currency>{swapFrom.usdValue}</AvaText.Body3>
            </View>
          }
        />
        <Space y={16} />
        <AvaText.Heading3 textStyle={{ marginHorizontal: 16 }}>
          To
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={<Avatar.Token token={swapTo.token!} />}
          title={swapTo.token?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1 animated textStyle={{ color: animatedColor }}>
                {swapTo.amount.toFixed(5)}
              </AvaText.Body1>
              <AvaText.Body3
                currency
                animated
                textStyle={{ color: animatedColor }}>
                {swapTo.usdValue}
              </AvaText.Body3>
            </View>
          }
        />
        <Separator style={{ marginHorizontal: 16, marginVertical: 24 }} />
        <SwapTransactionDetail review />
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <AvaButton.SecondaryLarge onPress={goBack}>
            Cancel
          </AvaButton.SecondaryLarge>
        </View>
        <View style={{ flex: 1, marginRight: 16 }}>
          <AvaButton.PrimaryLarge onPress={onConfirm}>
            Confirm
          </AvaButton.PrimaryLarge>
        </View>
      </View>
      <Space y={8} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default SwapReview
