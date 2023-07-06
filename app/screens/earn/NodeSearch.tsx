import React, { useEffect } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import Spinner from 'components/animation/Spinner'
import { DOCS_HOW_TO_DELEGATE } from 'resources/Constants'
import Logger from 'utils/Logger'
import Checkmark from 'components/animation/Checkmark'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchNode } from 'hooks/earn/useSearchNode'
import { useNodes } from 'hooks/earn/useNodes'
import { NodeValidator } from './SelectNode'

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
        <AvaText.Body2
          textStyle={{
            textAlign: 'center',
            color: theme.colorText1,
            lineHeight: 20
          }}>
          {`Core will randomly select a validator with 98% uptime and a 2%
          delegation fee in the Avalanche Network that also matches your
          criteria. `}
        </AvaText.Body2>
        <AvaText.Body2
          onPress={goToHowToDelegateDoc}
          textStyle={{ color: theme.colorPrimary1 }}>
          Learn more
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

type NavigationProp = EarnScreenProps<typeof AppNavigation.Earn.NodeSearch>

const MatchFound = ({ validator }: { validator: NodeValidator }) => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp['navigation']>()
  const { stakingAmount } = useRoute<NavigationProp['route']>().params

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(AppNavigation.Earn.Confirmation, {
        nodeId: validator.nodeID,
        stakingAmount
      })
    }, 2200)
    return () => clearTimeout(timer)
  })

  return (
    <View style={styles.container}>
      <Checkmark size={80} />
      <Space y={24} />
      <AvaText.Heading5>Search Completed!</AvaText.Heading5>
      <Space y={8} />
      <AvaText.Body2
        textStyle={{
          textAlign: 'center',
          color: theme.colorText1,
          lineHeight: 20
        }}>
        {'Core found a match.'}
      </AvaText.Body2>
    </View>
  )
}

export const NodeSearch = () => {
  const { stakingEndTime, stakingAmount } =
    useRoute<NavigationProp['route']>().params
  const { isFetching, error, data } = useNodes()
  const { validator, error: useSearchNodeError } = useSearchNode({
    stakingAmount,
    stakingEndTime,
    validators: data?.validators
  })

  if (isFetching) return <Searching />
  if (error) return null // todo: render error handling
  if (useSearchNodeError || !validator) return null // todo: render empty state
  return <MatchFound validator={validator} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginTop: '40%'
  }
})
