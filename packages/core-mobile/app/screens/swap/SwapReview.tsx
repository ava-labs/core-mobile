import React, { useCallback, useEffect, useState } from 'react'
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
import { Row } from 'components/Row'
import InfoSVG from 'components/svg/InfoSVG'
import { interval, tap } from 'rxjs'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { calculateRate } from 'swap/utils'
import { getTokenAddress } from 'swap/getSwapRate'
import { TokenType } from 'store/balance'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'

const SECOND = 1000

type Props = {
  onCancel: () => void
  onBackToParent: () => void
}

const SwapReview = ({ onCancel, onBackToParent }: Props): JSX.Element => {
  const {
    fromToken,
    toToken,
    optimalRate,
    gasLimit,
    gasPrice,
    slippage,
    refresh,
    swap,
    swapStatus
  } = useSwapContext()
  const theme = useApplicationContext().theme
  const [secondsLeft, setSecondsLeft] = useState('0s')
  const [colorAnim] = useState(new Animated.Value(1))

  useEffect(() => {
    if (swapStatus === 'Swapping') {
      onBackToParent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapStatus])

  useBeforeRemoveListener(
    useCallback(() => {
      AnalyticsService.capture('SwapCancelled')
    }, []),
    [RemoveEvents.GO_BACK]
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  const onHandleSwap = (): void => {
    AnalyticsService.capture('SwapConfirmed')
    if (
      fromToken &&
      toToken &&
      optimalRate &&
      gasLimit &&
      gasPrice &&
      slippage
    ) {
      swap({
        srcTokenAddress: getTokenAddress(fromToken),
        isSrcTokenNative: fromToken.type === TokenType.NATIVE,
        destTokenAddress: getTokenAddress(toToken),
        isDestTokenNative: toToken.type === TokenType.NATIVE,
        priceRoute: optimalRate,
        swapGasLimit: gasLimit,
        swapGasPrice: gasPrice,
        swapSlippage: slippage
      })
    }
  }

  //todo: fix color update anim
  // const animatedColor = useMemo(() => {
  //   return colorAnim.interpolate({
  //     inputRange: [0, 1],
  //     outputRange: [theme.colorText1, theme.colorPrimary1]
  //   })
  // }, [colorAnim])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optimalRate?.destAmount, optimalRate?.destUSD])

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
            refresh()
            AnalyticsService.capture('SwapReviewTimerRestarted')
          }
        })
      )
      .subscribe()
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Row style={{ justifyContent: 'space-between', marginHorizontal: 16 }}>
          <AvaText.LargeTitleBold>Review Order</AvaText.LargeTitleBold>
          <Tooltip
            content={'Quotes are refreshed to reflect current market prices'}
            position={'left'}
            style={{ width: 200 }}
            isLabelPopable>
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
          </Tooltip>
        </Row>
        <Space y={20} />
        <AvaText.Heading3 textStyle={{ marginHorizontal: 16 }}>
          From
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={
            fromToken && (
              <Avatar.Token
                name={fromToken.name}
                symbol={fromToken.symbol}
                logoUri={fromToken.logoUri}
              />
            )
          }
          title={fromToken?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1 ellipsizeMode={'middle'}>
                {bnToLocaleString(
                  new BN(optimalRate?.srcAmount || '0'),
                  optimalRate?.srcDecimals
                )}
              </AvaText.Body1>
              <AvaText.Body3 color={theme.colorText2} currency>
                {optimalRate?.srcUSD}
              </AvaText.Body3>
            </View>
          }
        />
        <Space y={16} />
        <AvaText.Heading3 textStyle={{ marginHorizontal: 16 }}>
          To
        </AvaText.Heading3>
        <AvaListItem.Base
          embedInCard
          leftComponent={
            toToken && (
              <Avatar.Token
                name={toToken.name}
                symbol={toToken.symbol}
                logoUri={toToken.logoUri}
              />
            )
          }
          title={toToken?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1 ellipsizeMode={'middle'}>
                {bnToLocaleString(
                  new BN(optimalRate?.destAmount || '0'),
                  optimalRate?.destDecimals
                )}
              </AvaText.Body1>
              <AvaText.Body3 currency color={theme.colorText2}>
                {optimalRate?.destUSD}
              </AvaText.Body3>
            </View>
          }
        />
        <Separator style={{ marginHorizontal: 16, marginVertical: 24 }} />
        <SwapTransactionDetail
          review
          gasPrice={gasPrice}
          gasLimit={gasLimit}
          rate={optimalRate ? calculateRate(optimalRate) : 0}
          slippage={slippage}
        />
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between'
        }}>
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <AvaButton.SecondaryLarge onPress={onCancel}>
            Cancel
          </AvaButton.SecondaryLarge>
        </View>
        <View style={{ flex: 1, marginRight: 16 }}>
          <AvaButton.PrimaryLarge
            onPress={() => {
              onHandleSwap()
            }}>
            Confirm
          </AvaButton.PrimaryLarge>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default SwapReview
