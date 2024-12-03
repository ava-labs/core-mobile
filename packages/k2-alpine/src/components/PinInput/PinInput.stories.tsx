import React, { useEffect, useRef, useState } from 'react'
import { Alert, Switch } from 'react-native'
import { ScrollView, Text, View } from '../Primitives'
import { useTheme } from '../..'
import { PinInput, PinInputActions } from './PinInput'

export default {
  title: 'PinInput'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [pinCode, setPinCode] = useState('')
  const [useEightDigit, setUseEightDigit] = useState(false)
  const PIN_CODE = useEightDigit ? '00000000' : '000000'
  const pinLength = useEightDigit ? 8 : 6

  const pinInputRef = useRef<PinInputActions>(null)

  const handleUseEightDigit = (value: boolean): void => {
    setUseEightDigit(value)
    setPinCode('')
    pinInputRef.current?.focus()
  }

  useEffect(() => {
    pinInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (pinCode.length !== pinLength) return

    pinInputRef.current?.blur()
    pinInputRef.current?.startLoadingAnimation()

    setTimeout(() => {
      pinInputRef.current?.stopLoadingAnimation(() => {
        if (pinCode === PIN_CODE) {
          Alert.alert('Pincode is correct', undefined, [
            {
              text: 'OK',
              onPress: () => {
                setPinCode('')
                pinInputRef.current?.focus()
              }
            }
          ])
        } else {
          pinInputRef.current?.fireWrongPinAnimation(() => {
            setPinCode('')
            pinInputRef.current?.focus()
          })
        }
      })
    }, 2000)
  }, [pinCode, PIN_CODE, pinLength])

  return (
    <ScrollView
      style={{
        width: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}
      contentContainerStyle={{ padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 20,
          justifyContent: 'space-between'
        }}>
        <View>
          <Text>Your Pincode: {PIN_CODE}</Text>
        </View>
        <View
          style={{
            gap: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Text>8 Digit</Text>
          <Switch value={useEightDigit} onValueChange={handleUseEightDigit} />
        </View>
      </View>
      <PinInput
        style={{
          alignItems: 'center',
          marginTop: 100,
          height: 100
        }}
        ref={pinInputRef}
        value={pinCode}
        onChangePin={setPinCode}
        length={pinLength}
      />
      <View style={{ height: 160 }} />
    </ScrollView>
  )
}
