// @ts-nocheck TODO CP-1725: Fix Typescript Errors - React Navigation
import React, { FC, useEffect, useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StyleProp, View, ViewStyle } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import InputText from 'components/InputText'
import { useNavigation } from '@react-navigation/native'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import AppNavigation from 'navigation/AppNavigation'
import Avatar from 'components/Avatar'
import numeral from 'numeral'

interface TokenSelectAndAmountProps {
  initAmount: string
  initToken?: TokenWithBalance | undefined
  onTokenSelect: (token: TokenWithBalance) => void
  onAmountSet: (amount: string) => void
  maxEnabled: boolean
  getMaxAmount?: () => string
  style?: StyleProp<ViewStyle>
  inputWidth?: number
}

const TokenSelectAndAmount: FC<TokenSelectAndAmountProps> = ({
  initAmount,
  initToken,
  onTokenSelect,
  onAmountSet,
  maxEnabled = false,
  getMaxAmount = undefined,
  style,
  inputWidth = 180
}) => {
  const context = useApplicationContext()
  const navigation = useNavigation()
  const [selectedToken, setSelectedToken] = useState<
    TokenWithBalance | undefined
  >(undefined)
  const [selectedAmount, setSelectedAmount] = useState('0')

  useEffect(() => {
    if (selectedAmount !== initAmount) {
      setSelectedAmount(initAmount)
    }
  }, [initAmount])

  useEffect(() => {
    if (selectedToken !== initToken) {
      setSelectedToken(initToken)
    }
  }, [initToken])

  function selectToken() {
    navigation.navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        onTokenSelect(token)
        setSelectedToken(token)
      }
    })
  }

  function setAmount(amount: string) {
    onAmountSet(amount)
    setSelectedAmount(amount)
  }

  function setMax() {
    if (selectedToken) {
      const amount =
        getMaxAmount?.() ||
        numeral(selectedToken.balanceDisplayValue).value()?.toString() ||
        '0'

      setAmount(amount)
    }
  }

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          paddingStart: 16,
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: context.theme.colorBg2,
          borderRadius: 10
        },
        style
      ]}>
      <AvaButton.Base
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1
        }}
        onPress={selectToken}>
        {selectedToken ? (
          <>
            <Avatar.Custom
              name={selectedToken.name}
              symbol={selectedToken.symbol}
              logoUri={selectedToken.logoURI}
            />
            <Space x={8} />
            <AvaText.Heading3>{selectedToken.symbol}</AvaText.Heading3>
          </>
        ) : (
          <AvaText.Heading3>Select</AvaText.Heading3>
        )}
        <Space x={8} />
        <CarrotSVG
          direction={'down'}
          size={12}
          color={context.theme.colorText1}
        />
      </AvaButton.Base>
      {/*<View style={{width: 180}}>*/}
      <InputText
        width={inputWidth}
        mode={'amount'}
        keyboardType="numeric"
        onMax={maxEnabled ? setMax : undefined}
        onChangeText={text => {
          setAmount(text)
        }}
        text={selectedAmount}
      />
      {/*</View>*/}
    </View>
  )
}

export default TokenSelectAndAmount
