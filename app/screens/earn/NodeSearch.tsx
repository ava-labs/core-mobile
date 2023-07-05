import React, { useEffect } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import Spinner from 'components/animation/Spinner'
import { DOCS_HOW_TO_DELEGATE } from 'resources/Constants'
import Logger from 'utils/Logger'
import Checkmark from 'components/animation/Checkmark'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { useNodes } from 'hooks/query/useNodes'

const Searching = () => {
  const { theme } = useApplicationContext()

  const goToHowToDelegateDoc = () => {
    Linking.openURL(DOCS_HOW_TO_DELEGATE).catch(e => {
      Logger.error(`failed to open ${DOCS_HOW_TO_DELEGATE}`, e)
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
        {
          'Core will look for a match in the Avalanche Network that meets your selected criteria. '
        }
        <AvaText.Body2
          onPress={goToHowToDelegateDoc}
          textStyle={{ color: theme.colorPrimary1 }}>
          Learn more
        </AvaText.Body2>
        {'.'}
      </AvaText.Body2>
    </View>
  )
}

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.NodeSearch
>['navigation']

const MatchFound = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()

  useEffect(() => {
    setTimeout(
      () => navigate(AppNavigation.Earn.Confirmation, { nodeId: '' }),
      2200
    )
  })

  return (
    <View style={styles.container}>
      <Checkmark size={80} />
      <Space y={24} />
      <AvaText.Heading5>Match Found!</AvaText.Heading5>
      <Space y={8} />
      <AvaText.Body2
        textStyle={{
          textAlign: 'center',
          color: theme.colorText1,
          lineHeight: 20
        }}>
        {'Core found a match for your criteria.'}
      </AvaText.Body2>
    </View>
  )
}

export const NodeSearch = () => {
  const { isFetching } = useNodes()

  if (isFetching) return <Searching />

  return <MatchFound />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '15%',
    marginTop: '40%'
  }
})
