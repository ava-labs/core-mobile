import React from 'react'
import { StyleSheet } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Opacity40 } from 'resources/Constants'
import StarSVG from './svg/StarSVG'
import AvaButton from './AvaButton'

type Props = {
  onPress: () => void
  selected: boolean
}

export const StarButton = ({ onPress, selected }: Props) => {
  const { theme } = useApplicationContext()

  const backgroundColor = theme.neutral700 + Opacity40

  const style = [styles.container, { backgroundColor }]

  return (
    <AvaButton.Base style={style} onPress={onPress} testID="star_svg">
      <StarSVG selected={selected} size={20} />
    </AvaButton.Base>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
