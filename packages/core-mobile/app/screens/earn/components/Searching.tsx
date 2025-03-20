import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Linking, StyleSheet, View } from 'react-native'
import { DOCS_STAKING_URL } from 'resources/Constants'
import Logger from 'utils/Logger'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import Spinner from 'components/animation/Spinner'

export const Searching = (): JSX.Element => {
  const { theme } = useApplicationContext()

  const goToHowToDelegateDoc = (): void => {
    Linking.openURL(DOCS_STAKING_URL).catch(e => {
      Logger.error(`failed to open ${DOCS_STAKING_URL}`, e)
    })
  }

  return (
    <View style={styles.container}>
      <Spinner size={77} />
      <Space y={24} />
      <AvaText.Heading5>Searching...</AvaText.Heading5>
      <Space y={8} />
      <AvaText.Body2
        textStyle={{
          textAlign: 'center',
          color: theme.colorText1,
          lineHeight: 20
        }}>
        <AvaText.Body2
          textStyle={{
            textAlign: 'center',
            color: theme.neutral50,
            lineHeight: 20
          }}>
          Core will randomly select a validator with 98% uptime and a 2%
          delegation fee in the Avalanche Network that also matches your
          criteria.
        </AvaText.Body2>
        <AvaText.Body2
          onPress={goToHowToDelegateDoc}
          textStyle={{ color: theme.colorPrimary1 }}>
          {' Learn more'}
        </AvaText.Body2>
        {'.'}
      </AvaText.Body2>
      <Space y={24} />
      <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
        To set your own inputs use advanced set up.
      </AvaText.Body2>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginTop: '40%'
  }
})
