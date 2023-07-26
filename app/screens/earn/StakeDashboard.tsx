import React from 'react'
import { View, StyleSheet } from 'react-native'
import AvaText from 'components/AvaText'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/chains-sdk'
import { Balance } from './components/Balance'
import { StakeTabs } from './StakeTabs'
import { WrongNetwork } from './WrongNetwork'

export const StakeDashboard = () => {
  const network = useSelector(selectActiveNetwork)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avalancheChainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID

  if (network.chainId !== avalancheChainId) {
    return <WrongNetwork />
  }

  return (
    <View style={styles.container}>
      <AvaText.LargeTitleBold>Stake</AvaText.LargeTitleBold>
      <Balance />
      <StakeTabs />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 16
  }
})
