import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import CarrotSVG from 'components/svg/CarrotSVG'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'

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
  const theme = useApplicationContext().theme

  return (
    <AvaButton.Base onPress={onPressed} testID="account_dropdown">
      <View style={[styles.accountTitleContainer]} testID="account_dropdown">
        <AvaText.Heading3
          testID="account_dropdown_title"
          ellipsizeMode={'middle'}
          textStyle={{
            marginRight: 11,
            lineHeight: 22,
            fontSize: 17
          }}>
          {activeAccount?.title}
        </AvaText.Heading3>
        <CarrotSVG
          color={theme.colorText1}
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
