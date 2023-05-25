import AvaText from 'components/AvaText'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Card from 'components/Card'
import { bigIntToString } from '@avalabs/utils-sdk'
import { truncateNodeId } from 'utils/Utils'
import Separator from 'components/Separator'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import moment from 'moment'
import { Avalanche } from '@avalabs/wallets-sdk'

const AddDelegatorTxView = ({
  tx,
  avaxPrice
}: {
  tx: Avalanche.AddDelegatorTx
  avaxPrice: number
}) => {
  const { theme } = useApplicationContext()
  const { tokenInCurrencyFormatter, currencyFormatter } =
    useApplicationContext().appHook
  const { nodeID, start, end, stake } = tx
  const startDate = moment(new Date(parseInt(start) * 1000)).format(
    'MMM DD, YYYY, HH:mm A'
  )
  const endDate = moment(new Date(parseInt(end) * 1000)).format(
    'MMM DD, YYYY, HH:mm A'
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return (
    <View>
      <AvaText.Heading4>Approve Add Delegator</AvaText.Heading4>
      <Space y={28} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Staking Details
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText2}>Node</AvaText.Caption>
        </Row>
        <Space y={4} />
        <Row style={styles.rowContainer}>
          <AvaText.Caption color={theme.colorText1}>
            {truncateNodeId(nodeID)}
          </AvaText.Caption>
        </Row>
        <Space y={24} />
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>
            Stake Amount
          </AvaText.Caption>
          <AvaText.Subtitle2 color={theme.neutral50}>
            {Number(bigIntToString(stake, 9))} AVAX
          </AvaText.Subtitle2>
        </Row>
        <Row style={styles.currencyContainer}>
          <AvaText.Caption color={theme.colorText2}>
            {`${tokenInCurrencyFormatter(
              Number(bigIntToString(stake, 9)) * avaxPrice
            )} ${selectedCurrency}`}
          </AvaText.Caption>
        </Row>
        <Space y={8} />
        <Separator style={styles.separator} color={theme.neutral800} />
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>Start Date</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {startDate.toLocaleString()}
          </AvaText.Subtitle2>
        </Row>
        <Space y={8} />
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>End Date</AvaText.Caption>
          <AvaText.Subtitle2 color={theme.colorText1}>
            {endDate.toLocaleString()}
          </AvaText.Subtitle2>
        </Row>
      </Card>
      <Space y={24} />
      <AvaText.Body2 color={theme.colorText1} textStyle={{ lineHeight: 20 }}>
        Network Fee
      </AvaText.Body2>
      <Space y={8} />
      <Card style={styles.cardContainer}>
        <Row style={styles.rowCenterContainer}>
          <AvaText.Caption color={theme.colorText1}>Fee Amount</AvaText.Caption>
          <View style={styles.feeContainer}>
            <AvaText.Subtitle2 color={theme.neutral50}>
              0 AVAX
            </AvaText.Subtitle2>
          </View>
        </Row>
        <Space y={2} />
        <Row style={styles.currencyContainer}>
          <AvaText.Caption color={theme.neutral400}>
            {currencyFormatter(0)}
          </AvaText.Caption>
        </Row>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    justifyContent: 'space-between'
  },
  rowCenterContainer: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  separator: {
    marginVertical: 16
  },
  innerRow: {
    alignItems: 'center'
  },
  feeContainer: {
    alignItems: 'flex-end'
  },
  currencyContainer: {
    justifyContent: 'flex-end'
  },
  cardContainer: {
    padding: 16
  }
})

export default AddDelegatorTxView
