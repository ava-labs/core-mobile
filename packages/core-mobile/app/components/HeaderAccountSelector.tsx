import React from 'react'
import AvaButton from 'components/AvaButton'
import { StyleSheet, View } from 'react-native'
import CarrotSVG from 'components/svg/CarrotSVG'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { ActivityIndicator, Text, useTheme } from '@avalabs/k2-mobile'

export type Direction = 'up' | 'down'

export default function HeaderAccountSelector({
  onPressed,
  direction
}: {
  onPressed?: () => void
  direction?: Direction
  testID?: string
}): JSX.Element {
  const activeAccount = useSelector(selectActiveAccount)
  const {
    theme: { colors }
  } = useTheme()

  return (
    <AvaButton.Base onPress={onPressed} testID="account_dropdown">
      <View style={[styles.accountTitleContainer]} testID="account_dropdown">
        {activeAccount ? (
          <Text
            testID="account_dropdown_title"
            variant="subtitle1"
            ellipsizeMode={'middle'}
            sx={{
              marginRight: 11,
              lineHeight: 22,
              fontSize: 17
            }}>
            {activeAccount?.title}
          </Text>
        ) : (
          <ActivityIndicator size="small" color={'$neutral50'} />
        )}
        <CarrotSVG
          color={colors.$neutral50}
          direction={direction}
          testID="account_dropdown_carrot"
        />
      </View>
    </AvaButton.Base>
  )
}

const styles = StyleSheet.create({
  accountTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    maxWidth: 200
  }
})
