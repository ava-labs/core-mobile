import React from 'react'
import { StyleSheet, View } from 'react-native'
import { EarnScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { usePChainBalance } from 'hooks/earn/usePChainBalance'
import { useNavigation } from '@react-navigation/native'
import Separator from 'components/Separator'
import AvaText from 'components/AvaText'
import { Popable } from 'react-native-popable'
import { PopableContent } from 'components/PopableContent'
import { PopableLabel } from 'components/PopableLabel'
import { Row } from 'components/Row'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { useNAvaxFormatter } from 'hooks/formatter/useNAvaxFormatter'
import { Space } from 'components/Space'
import { useClaimRewards } from 'hooks/earn/useClaimRewards'
import { showSimpleToast } from 'components/Snackbar'
import { useClaimFees } from 'hooks/earn/useClaimFees'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'
import { ConfirmScreen } from './components/ConfirmScreen'
import UnableToEstimate from './components/UnableToEstimate'

type ScreenProps = EarnScreenProps<typeof AppNavigation.Earn.ClaimRewards>

const onClaimError = (error: Error) => {
  showSimpleToast(error.message)
}

const ClaimRewards = () => {
  const { theme } = useApplicationContext()
  const { goBack } = useNavigation<ScreenProps['navigation']>()
  const activeNetwork = useSelector(selectActiveNetwork)
  const { data } = usePChainBalance()
  const { totalFees } = useClaimFees()
  const nAvaxFormatter = useNAvaxFormatter()
  const avaxFormatter = useAvaxFormatter()
  const claimRewardsMutation = useClaimRewards(goBack, onClaimError)

  const unableToGetFees = totalFees === undefined

  if (!data) return null

  const tokenSymbol = activeNetwork.networkToken.symbol

  const [claimableAmountInAvax, claimableAmountInCurrency] = nAvaxFormatter(
    data.unlockedUnstaked[0]?.amount,
    true
  )

  const [feesInAvax, feesInCurrency] = avaxFormatter(totalFees)

  const renderFees = () => {
    if (unableToGetFees) return <UnableToEstimate />

    return (
      <View
        style={{
          alignItems: 'flex-end',
          marginTop: -4
        }}>
        <AvaText.Heading6>{feesInAvax} AVAX</AvaText.Heading6>
        <Space y={4} />
        <AvaText.Body3 color={theme.colorText2}>{feesInCurrency}</AvaText.Body3>
      </View>
    )
  }

  return (
    <ConfirmScreen
      isConfirming={claimRewardsMutation.isPending}
      onConfirm={() => {
        claimRewardsMutation.mutate()
      }}
      onCancel={goBack}
      header="Claim Rewards"
      confirmBtnTitle="Claim Now"
      cancelBtnTitle="Cancel"
      confirmBtnDisabled={unableToGetFees}>
      <View style={styles.verticalPadding}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Claimable Amount</AvaText.Body2>
          <AvaText.Heading1 textStyle={{ marginTop: -2 }}>
            {claimableAmountInAvax + ' ' + tokenSymbol}
          </AvaText.Heading1>
        </Row>
        <Space y={4} />
        <AvaText.Heading3
          textStyle={{ alignSelf: 'flex-end', color: theme.colorText2 }}>
          {claimableAmountInCurrency}
        </AvaText.Heading3>
      </View>
      <Separator />

      <Row
        style={{
          paddingVertical: 16,
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
        <Popable
          content={
            <PopableContent message={'Fees paid to execute the transaction'} />
          }
          position="right"
          strictPosition={true}
          style={{ minWidth: 180 }}
          backgroundColor={theme.colorBg3}>
          <PopableLabel label="Network Fee" />
        </Popable>
        {renderFees()}
      </Row>
    </ConfirmScreen>
  )
}

const styles = StyleSheet.create({
  verticalPadding: {
    paddingVertical: 16
  }
})

export default ClaimRewards
