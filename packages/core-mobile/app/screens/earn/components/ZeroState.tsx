import React, { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import EarnSVG from 'components/svg/EarnSVG'
import { Space } from 'components/Space'
import ClockSVG from 'components/svg/ClockSVG'

type ZeroStateProps = {
  image: ReactNode
  title: string
  subTitle: string
}

const ZeroState = ({ image, title, subTitle }: ZeroStateProps) => {
  return (
    <View style={styles.container}>
      {image}
      <Space y={28} />
      <AvaText.Heading5>{title}</AvaText.Heading5>
      <Space y={8} />
      <AvaText.Body2>{subTitle}</AvaText.Body2>
    </View>
  )
}

export const NoActiveStakes = () => {
  return (
    <ZeroState
      image={<EarnSVG selected size={57} />}
      title="No Active Stakes"
      subTitle='Press "Stake" above to begin staking.'
    />
  )
}

export const NoPastStakes = () => {
  return (
    <ZeroState
      image={<ClockSVG />}
      title="No History"
      subTitle="Check the Active tab to see current stakes."
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    marginTop: 34,
    alignItems: 'center'
  }
})
