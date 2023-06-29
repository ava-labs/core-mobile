import React, { useState, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'

import {
  calculateMaxWeight,
  formatLargeNumber,
  generateGradient,
  truncateNodeId
} from 'utils/Utils'
import { Row } from 'components/Row'
import CollapsibleSection from 'components/CollapsibleSection'
import CarrotSVG from 'components/svg/CarrotSVG'
import CopySVG from 'components/svg/CopySVG'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { copyToClipboard } from 'utils/DeviceTools'
import Big from 'big.js'
import LinearGradientSVG from 'components/svg/LinearGradientSVG'
import { format } from 'date-fns'
import { NodeValidator } from '../SelectNode'

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.SelectNode
>['navigation']

export const NodeCard = ({ data }: { data: NodeValidator }) => {
  const { theme } = useApplicationContext()
  const [isCardExpanded, setIsCardExpanded] = useState(false)
  const { navigate } = useNavigation<NavigationProp>()

  const endDate = format(new Date(parseInt(data.endTime) * 1000), 'MM/dd/yy')

  const stakeAmount = new Big(data.stakeAmount)
  const delegatorWeight = new Big(data.delegatorWeight || 0)
  const currentWeight = stakeAmount.plus(delegatorWeight)

  const maxWeight = calculateMaxWeight(new Big(3000000e9), stakeAmount)

  const validatorStake = stakeAmount.div(Math.pow(10, 9)).toNumber()

  const available = maxWeight.maxWeight
    .minus(currentWeight)
    .div(Math.pow(10, 9))

  const gradientColors = useMemo(() => generateGradient(), [])

  return (
    <View
      style={{
        backgroundColor: theme.neutral900,
        borderRadius: 8
      }}>
      <CollapsibleSection
        onExpandedChange={value => setIsCardExpanded(value)}
        title={
          <View
            style={[
              styles.titleContainer,
              { backgroundColor: theme.neutral900 }
            ]}>
            <View style={styles.titleRowContainer}>
              <View style={styles.gradientContainer}>
                <LinearGradientSVG
                  colorFrom={gradientColors.colorFrom}
                  colorTo={gradientColors.colorTo}
                  opacityFrom={0.8}
                  opacityTo={0.3}
                />
              </View>
              <View>
                <AvaButton.TextWithIcon
                  textStyle={{ textAlign: 'left' }}
                  onPress={() => copyToClipboard(data.nodeID)}
                  icon={<CopySVG />}
                  iconPlacement="right"
                  text={
                    <AvaText.Body2 color={theme.colorText1}>
                      {truncateNodeId(data.nodeID, 4)}
                    </AvaText.Body2>
                  }
                />
                <AvaText.Caption color={theme.neutral400}>
                  {`End date: ${endDate}`}
                </AvaText.Caption>
              </View>
              <View style={styles.uptimeContainer}>
                <AvaText.Subtitle2
                  color={theme.colorText2}
                  textStyle={{
                    textAlign: 'right',
                    fontSize: 10,
                    lineHeight: 16,
                    fontWeight: '500'
                  }}>
                  Uptime
                </AvaText.Subtitle2>
                <AvaText.Heading6
                  color={theme.neutralSuccessLight}
                  textStyle={{ textAlign: 'right' }}>
                  {`${Number(data.uptime).toFixed(0)}%`}
                </AvaText.Heading6>
              </View>
              <View
                style={{
                  justifyContent: 'center'
                }}>
                <CarrotSVG
                  color={theme.neutral50}
                  direction={isCardExpanded ? 'up' : 'down'}
                />
              </View>
            </View>
          </View>
        }
        collapsibleContainerStyle={{
          backgroundColor: theme.neutral900,
          padding: 16,
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8
        }}>
        <View
          style={[
            styles.collapseContainer,
            { borderTopColor: theme.neutral800 }
          ]}
        />
        <View>
          <Row style={styles.rowContainer}>
            <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
              Node ID
            </AvaText.Caption>
            <AvaText.Body2
              textStyle={{
                color: theme.neutral50,
                textAlign: 'right'
              }}>
              {truncateNodeId(data.nodeID, 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
              Staking Fee
            </AvaText.Caption>
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {`${Number(data.delegationFee).toFixed(0)}%`}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
              Validator Stake
            </AvaText.Caption>
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {(formatLargeNumber(validatorStake), 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
              Available
            </AvaText.Caption>
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {formatLargeNumber(available.toNumber(), 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <AvaText.Caption textStyle={{ color: theme.neutral400 }}>
              Delegates
            </AvaText.Caption>
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {data.delegatorCount}
            </AvaText.Body2>
          </Row>
        </View>
        <View style={{ marginTop: 19 }}>
          <AvaButton.PrimaryMedium
            onPress={() =>
              navigate(AppNavigation.Earn.Confirmation, {
                nodeId: data.nodeID
              })
            }>
            Next
          </AvaButton.PrimaryMedium>
        </View>
      </CollapsibleSection>
    </View>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    borderRadius: 8,
    padding: 16
  },
  gradientContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden'
  },
  titleRowContainer: {
    display: 'flex',
    flexDirection: 'row'
  },
  uptimeContainer: {
    marginLeft: 50,
    marginRight: 16
  },
  collapseContainer: {
    borderTopWidth: 1,
    marginBottom: 11.5,
    marginTop: 16
  },
  rowContainer: {
    justifyContent: 'space-between',
    marginBottom: 8
  }
})
