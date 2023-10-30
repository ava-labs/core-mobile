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
}) {
  const activeAccount = useSelector(selectActiveAccount)
  const theme = useApplicationContext().theme

  return (
    <AvaButton.Base onPress={onPressed}>
      <View style={[styles.accountTitleContainer]}>
        <AvaText.Heading3
          ellipsizeMode={'middle'}
          textStyle={{
            marginRight: 11,
            lineHeight: 22,
            fontSize: 17
          }}>
          {activeAccount?.title}
        </AvaText.Heading3>
        <CarrotSVG color={theme.colorText1} direction={direction} />
      </View>
    </AvaButton.Base>
  )
}

const styles = StyleSheet.create({
  accountTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44
  }
})
