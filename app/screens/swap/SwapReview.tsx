import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  View
} from 'react-native'
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
import { Popable } from 'react-native-popable'
import { bnToLocaleString, resolve } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import { getTokenAddress } from 'swap/getSwapRate'
import { ShowSnackBar } from 'components/Snackbar'
import {
  RemoveEvents,
  useBeforeRemoveListener
} from 'hooks/useBeforeRemoveListener'
import { usePosthogContext } from 'contexts/PosthogContext'

const SECOND = 1000

type Props = {
  onCancel: () => void
  onConfirm: () => void
}

const SwapReview = ({ onCancel, onConfirm }: Props) => {
  const [swapInProgress, setSwapInProgress] = useState(false)
  const {
    fromToken,
    toToken,
    optimalRate,
    gasLimit,
    gasPrice,
    slippage,
    rate,
    refresh,
    swap
  } = useSwapContext()
  const theme = useApplicationContext().theme
  const [secondsLeft, setSecondsLeft] = useState('0s')
  const [colorAnim] = useState(new Animated.Value(1))
  const { capture } = usePosthogContext()
  const [hasConfirmed, setHasConfirmed] = useState(false)

  const [swapError, setSwapError] = useState('')

  const onHandleSwap = async () => {
    if (
      fromToken &&
      toToken &&
      optimalRate &&
      gasLimit &&
      gasPrice &&
      slippage
    ) {
      setSwapInProgress(true)
      const [result, error] = await resolve(
        swap(
          getTokenAddress(fromToken),
          getTokenAddress(toToken),
          toToken?.decimals ?? 0,
          fromToken?.decimals ?? 0,
          optimalRate.srcAmount,
          optimalRate,
          optimalRate.destAmount,
          gasLimit,
          gasPrice,
          slippage
        )
      )
      setSwapInProgress(false)
      if (error || (result && 'error' in result)) {
        setSwapError(error?.toString || result?.error?.message)
        ShowSnackBar('Swap Failed')
        return
      }

      ShowSnackBar('Swap Successful')
    }
  }

  //todo: fix color update anim
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const animatedColor = useMemo(() => {
    return colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.colorText1, theme.colorPrimary1]
    })
  }, [colorAnim])

  useEffect(() => {
    //this is so that useBeforeRemoveListener has a chance to update callback
    if (hasConfirmed) {
      capture('SwapConfirmed')
      onHandleSwap()
    }
  }, [capture, hasConfirmed, onConfirm])

  useBeforeRemoveListener(
    useCallback(() => {
      if (!hasConfirmed) {
        capture('SwapCancelled')
      }
    }, [capture, hasConfirmed]),
    [RemoveEvents.GO_BACK, RemoveEvents.POP]
  )

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
            console.log('reset')
            refresh()
            capture('SwapReviewTimerRestarted')
          }
        })
      )
      .subscribe()
    return () => sub.unsubscribe()
  }, [])

  return (
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
          leftComponent={fromToken && <Avatar.Token token={fromToken} />}
          title={fromToken?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1>
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
          leftComponent={toToken && <Avatar.Token token={toToken} />}
          title={toToken?.symbol}
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1>
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
          rate={rate}
          slippage={slippage}
          walletFee={optimalRate?.partnerFee}
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
          <AvaButton.PrimaryLarge onPress={() => setHasConfirmed(true)}>
            Confirm
          </AvaButton.PrimaryLarge>
        </View>
      </View>
      <Space y={8} />
      {swapInProgress && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#00000080',
              justifyContent: 'center',
              alignItems: 'center'
            }
          ]}>
          <ActivityIndicator size={'large'} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

export default SwapReview
