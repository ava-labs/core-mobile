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
import { useNodes } from 'hooks/earn/useNodes'
import {
  getRandomValidator,
  getSimpleSortedValidators,
  getFilteredValidators
} from 'services/earn/utils'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
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
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const { stakingEndTime, stakingAmount } =
    useRoute<NavigationProp['route']>().params
  const { isFetching, data, error } = useNodes()

  if (isFetching) return <Searching />
  if (error)
    return (
      <Text style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
        we should render the message with a retry option
      </Text>
    )

  if (data?.validators && data.validators.length > 0) {
    try {
      const filteredValidators = getFilteredValidators({
        isDeveloperMode,
        validators: data?.validators,
        stakingAmount,
        stakingEndTime,
        minUpTime: 98
      })

      const sortedValidators = getSimpleSortedValidators(filteredValidators)
      const matchedValidator = getRandomValidator(sortedValidators)
      return <MatchFound validator={matchedValidator} />
    } catch {
      Logger.info(
        `no node matches filter criteria: stakingAmount:  ${stakingAmount}, stakingEndTime: ${stakingEndTime}, minUpTime: 98%`
      )
      // empty state when nothing matches filter
      return (
        <Text
          style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
          waiting for design
        </Text>
      )
    }
  }
  return (
    <Text style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
      waiting for design
    </Text>
  ) // empty state when nothing matches filter
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginTop: '40%'
  }
})
