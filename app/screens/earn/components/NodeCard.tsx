import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { formatLargeNumber, truncateNodeId } from 'utils/Utils'
import { Row } from 'components/Row'
import CollapsibleSection from 'components/CollapsibleSection'
import CarrotSVG from 'components/svg/CarrotSVG'
import CopySVG from 'components/svg/CopySVG'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { copyToClipboard } from 'utils/DeviceTools'
import LinearGradientSVG from 'components/svg/LinearGradientSVG'
import { format } from 'date-fns'
import { calculateMaxWeight, generateGradient } from 'services/earn/utils'
import { NodeValidator } from 'types/earn'
import { BigIntNAvax } from 'types/denominations'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { PopableContentWithCaption } from './PopableContentWithCaption'

type NavigationProp = EarnScreenProps<
  typeof AppNavigation.Earn.SelectNode
>['navigation']

export const NodeCard = ({
  data,
  stakingAmount,
  stakingEndTime
}: {
  data: NodeValidator
  stakingAmount: BigIntNAvax
  stakingEndTime: Date
}) => {
  const { theme } = useApplicationContext()
  const [isCardExpanded, setIsCardExpanded] = useState(false)
  const { navigate } = useNavigation<NavigationProp>()

  const endDate = format(new Date(parseInt(data.endTime) * 1000), 'MM/dd/yy')

  const stakeAmount = BigInt(data.stakeAmount)
  const delegatorWeight = BigInt(data.delegatorWeight || 0)
  const currentWeight: BigIntNAvax = stakeAmount + delegatorWeight

  const maxWeight = calculateMaxWeight(BigInt(3000000e9), stakeAmount)

  const validatorStake = bigintToBig(stakeAmount, 9).toFixed(2)

  const available = bigintToBig(maxWeight.maxWeight - currentWeight, 9)

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
              <View style={styles.iconContainer}>
                <View style={[styles.gradientContainer]}>
                  <LinearGradientSVG
                    colorFrom={gradientColors.colorFrom}
                    colorTo={gradientColors.colorTo}
                    opacityFrom={0.8}
                    opacityTo={0.3}
                  />
                </View>
              </View>

              <View style={styles.nodeTextContainer}>
                <AvaButton.TextWithIcon
                  textStyle={{ textAlign: 'left' }}
                  onPress={() => copyToClipboard(data.nodeID)}
                  icon={<CopySVG />}
                  iconPlacement="right"
                  text={
                    <AvaText.Body2 color={theme.neutral50}>
                      {truncateNodeId(data.nodeID, 4)}
                    </AvaText.Body2>
                  }
                />
                <AvaText.Caption
                  color={theme.neutral400}
                  textStyle={{ textAlign: 'left' }}>
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
              <View style={styles.carrotIcon}>
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
          paddingHorizontal: 16,
          marginTop: -16,
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
            <PopableContentWithCaption
              label="Node ID"
              message="ID of the node"
            />
            <AvaText.Body2
              textStyle={{
                color: theme.neutral50,
                textAlign: 'right'
              }}>
              {truncateNodeId(data.nodeID, 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <PopableContentWithCaption
              label="Staking Fee"
              message="Fee set and retained by the validator"
              contentWidth={150}
            />
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {`${Number(data.delegationFee).toFixed(0)}%`}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <PopableContentWithCaption
              label="Validator Stake"
              message="Amount of AVAX staked by the validator"
              contentWidth={150}
            />
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {formatLargeNumber(validatorStake, 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <PopableContentWithCaption
              label="Available"
              message="Amount of AVAX the validator can accept"
              contentWidth={150}
            />
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {formatLargeNumber(available.toString(), 4)}
            </AvaText.Body2>
          </Row>
          <Row style={styles.rowContainer}>
            <PopableContentWithCaption
              label="Delegates"
              message="Number of addresses delegating to the validator"
              contentWidth={150}
            />
            <AvaText.Body2 textStyle={{ color: theme.neutral50 }}>
              {data.delegatorCount}
            </AvaText.Body2>
          </Row>
        </View>
        <View style={{ marginTop: 19 }}>
          <AvaButton.PrimaryMedium
            onPress={() =>
              navigate(AppNavigation.Earn.Confirmation, {
                nodeId: data.nodeID,
                stakingAmount,
                stakingEndTime
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
    flexDirection: 'row',
    flex: 1
  },
  uptimeContainer: {
    marginLeft: 50,
    marginRight: 16,
    flex: 0.3
  },
  collapseContainer: {
    borderTopWidth: 1,
    marginBottom: 11.5,
    marginTop: 16
  },
  rowContainer: {
    justifyContent: 'space-between',
    marginBottom: 8
  },
  nodeTextContainer: {
    flex: 0.7,
    justifyContent: 'center',
    marginLeft: 8
  },
  iconContainer: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  carrotIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0.2
  }
})
