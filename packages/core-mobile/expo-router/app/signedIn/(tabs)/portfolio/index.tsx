import React from 'react'
import { View } from 'react-native'
import { Link } from 'expo-router'
import useHomeScreenHeader from '../../../../hooks/useHomeScreenHeader'

const PortfolioHomeScreen = (): JSX.Element => {
  useHomeScreenHeader()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Link href="/signedIn/portfolio/assets">Go to Portfolio Assets</Link>
    </View>
  )
}

export default PortfolioHomeScreen
