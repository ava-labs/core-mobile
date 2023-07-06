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
import { useNodes } from 'hooks/query/useNodes'
import { Validator } from 'utils/getFilteredValidators'
import { getSimpleSortedValidators } from 'utils/getSortedValidators'

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

const MatchFound = ({ validator }: { validator: Validator }) => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp['navigation']>()
  const { stakingAmount } = useRoute<NavigationProp['route']>().params

  useEffect(() => {
    setTimeout(
      () =>
        navigate(AppNavigation.Earn.Confirmation, {
          validator,
          stakingAmount
        }),
      2200
    )
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
  const { stakingDuration, stakingAmount } =
    useRoute<NavigationProp['route']>().params
  const { isFetching, data } = useNodes({
    stakingAmount,
    stakingDuration,
    minUpTime: 98
  })

  if (isFetching) return <Searching />

  if (data && data.length > 0) {
    const validator = getSimpleSortedValidators(data)
    return <MatchFound validator={validator} />
  }
  return <Text>waiting for design</Text> // error state when nothing matches filter
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginTop: '40%'
  }
})
