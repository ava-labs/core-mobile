import React, { FC } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StyleProp, View, ViewStyle } from 'react-native'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import CarrotSVG from 'components/svg/CarrotSVG'
import InputText from 'components/InputText'
import Avatar from 'components/Avatar'
import numeral from 'numeral'
import { TokenWithBalance } from 'store/balance'

interface TokenSelectAndAmountProps {
  selectedToken: TokenWithBalance | undefined
  amount: string
  onOpenSelectToken: () => void
  onAmountSet: (amount: string) => void
  maxEnabled: boolean
  getMaxAmount?: () => string
  style?: StyleProp<ViewStyle>
  inputWidth?: number
}

const TokenSelectAndAmount: FC<TokenSelectAndAmountProps> = ({
  selectedToken,
  amount,
  onOpenSelectToken,
  onAmountSet,
  maxEnabled = false,
  getMaxAmount = undefined,
  style,
  inputWidth = 180
}) => {
  const context = useApplicationContext()

  function setMax() {
    if (selectedToken) {
      const amount =
        getMaxAmount?.() ||
        numeral(selectedToken.balanceDisplayValue).value()?.toString() ||
        '0'

      onAmountSet(amount)
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
        onPress={onOpenSelectToken}>
        {selectedToken ? (
          <>
            <Avatar.Custom
              name={selectedToken.name}
              symbol={selectedToken.symbol}
              logoUri={selectedToken.logoUri}
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
        onChangeText={onAmountSet}
        text={amount}
      />
      {/*</View>*/}
    </View>
  )
}

export default TokenSelectAndAmount
