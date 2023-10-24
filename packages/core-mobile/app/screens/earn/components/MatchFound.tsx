import React from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import { useEffect } from 'react'
import { NodeValidator } from 'types/earn'
import AvaText from 'components/AvaText'
import Checkmark from 'components/animation/Checkmark'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { handleStakeConfirmationGoBack } from 'utils/earn/handleStakeConfirmationGoBack'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.NodeSearch
>

export const MatchFound = ({ validator }: { validator: NodeValidator }) => {
  const { theme } = useApplicationContext()
  const navigation = useNavigation<ScreenProps['navigation']>()
  const { stakingAmount, stakingEndTime } =
    useRoute<ScreenProps['route']>().params

  const handleOnBack = () => {
    handleStakeConfirmationGoBack(navigation)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate(AppNavigation.StakeSetup.Confirmation, {
        nodeId: validator.nodeID,
        stakingAmount,
        stakingEndTime,
        onBack: handleOnBack
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginTop: '40%'
  }
})
