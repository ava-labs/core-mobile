import React, { FC, useEffect } from 'react'
import { Linking, View, useWindowDimensions } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import OvalTagBg from 'components/OvalTagBg'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import ConfirmationTracker from 'screens/bridge/components/ConfirmationTracker'
import { useStopwatch } from 'react-timer-hook'
import { Blockchain } from '@avalabs/bridge-sdk'
import InfoSVG from 'components/svg/InfoSVG'
import { Space } from 'components/Space'
import { Popable, usePopable } from 'react-native-popable'
import { DOCS_BTC_TO_BTCB_FAQ } from 'resources/Constants'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import { useSelector } from 'react-redux'
import { getFormattedDistance } from 'utils/date/getFormattedDistance'

interface Props {
  sourceChain?: Blockchain
  targetChain?: Blockchain
  paddingHorizontal?: number
  confirmationCount: number
  requiredConfirmationCount: number
  startTime?: number
  endTime?: number
  started: boolean
}

const padTimeElapsed = (startTime: number, endTime?: number): Date => {
  // based on created time, set elapsed time offset

  const now = Date.now()
  const diff = (endTime || now) - startTime
  return new Date(now + diff)
}

function ElapsedTimer({
  sourceChain,
  targetChain,
  startTime,
  endTime
}: {
  sourceChain?: Blockchain
  targetChain?: Blockchain
  startTime: number
  endTime?: number
}): JSX.Element {
  const theme = useApplicationContext().theme
  const { hours, minutes, seconds, reset } = useStopwatch({
    autoStart: !endTime,
    offsetTimestamp: padTimeElapsed(startTime, endTime)
  })

  const handleOpenFaq = (): void => {
    Linking.openURL(DOCS_BTC_TO_BTCB_FAQ).catch(e => {
      Logger.error(`failed to open ${DOCS_BTC_TO_BTCB_FAQ}`, e)
    })
  }

  // Stop the timer when we know the endTime
  useEffect(() => {
    if (endTime) {
      reset(padTimeElapsed(startTime, endTime), false)
    }
    // Cannot add `reset` because it changes on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime])

  const displayedSeconds = seconds.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  })
  const displayedMinutes = minutes.toLocaleString('en-US', {
    minimumIntegerDigits: 2
  })
  const displayedHours = hours > 0 ? hours.toLocaleString('en-US') : undefined
  const complete = !!endTime

  const showInfoIcon =
    !complete &&
    sourceChain === Blockchain.AVALANCHE &&
    targetChain === Blockchain.BITCOIN

  return (
    <OvalTagBg
      style={{
        borderRadius: 50,
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: complete ? theme.colorSuccess : theme.colorBg3,
        flexDirection: 'row'
      }}>
      <AvaText.ButtonSmall
        textStyle={{
          color: theme.colorText1
        }}>
        {displayedHours && `${displayedHours}:`}
        {displayedMinutes}:{displayedSeconds}
      </AvaText.ButtonSmall>
      {showInfoIcon && (
        <>
          <Space x={4} />
          <PopableInfo openFaq={handleOpenFaq} />
        </>
      )}
      {complete && (
        <>
          <Space x={4} />
          <CheckmarkSVG color={theme.white} size={10} />
        </>
      )}
    </OvalTagBg>
  )
}

const BridgeConfirmations: FC<Props> = ({
  sourceChain,
  targetChain,
  confirmationCount,
  requiredConfirmationCount,
  startTime,
  endTime = 0,
  paddingHorizontal = 16,
  started = false
}) => {
  return (
    <View>
      <AvaListItem.Base
        title={<AvaText.Body2>Confirmations</AvaText.Body2>}
        titleAlignment="flex-start"
        rightComponent={
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Heading3 textStyle={{ marginEnd: 8 }}>
              {confirmationCount > // to avoid showing 16/15 since confirmations keep going up
              requiredConfirmationCount
                ? requiredConfirmationCount
                : confirmationCount}
              /{requiredConfirmationCount}
            </AvaText.Heading3>
            {startTime && (
              <ElapsedTimer
                startTime={startTime}
                endTime={endTime}
                sourceChain={sourceChain}
                targetChain={targetChain}
              />
            )}
          </Row>
        }
      />
      <View style={{ paddingHorizontal: paddingHorizontal }}>
        <ConfirmationTracker
          started={started}
          requiredCount={requiredConfirmationCount}
          currentCount={
            confirmationCount > requiredConfirmationCount
              ? requiredConfirmationCount
              : confirmationCount
          }
        />
      </View>
    </View>
  )
}

const PopableInfo = ({ openFaq }: { openFaq: () => void }): JSX.Element => {
  const theme = useApplicationContext().theme
  const width = useWindowDimensions().width
  const config = useSelector(selectBridgeAppConfig)
  const [ref, { hide }] = usePopable()

  const handleOnPress = (): void => {
    openFaq()
    hide()
  }

  const offboardDelayDuration = config?.criticalBitcoin.offboardDelaySeconds
    ? getFormattedDistance(config.criticalBitcoin.offboardDelaySeconds)
    : '12 hours'

  const renderPopoverInfoText = (): JSX.Element => (
    <View
      style={{
        marginHorizontal: 8,
        marginVertical: 4,
        backgroundColor: theme.neutral100
      }}>
      <AvaText.Caption textStyle={{ color: theme.neutral900 }}>
        {`Bridging from Avalanche to Bitcoin takes approximately ${offboardDelayDuration}. Please see the `}
        <AvaText.Caption
          textStyle={{ color: theme.blueDark, fontWeight: '600' }}
          onPress={handleOnPress}>
          FAQ
        </AvaText.Caption>
        {' for additional info.'}
      </AvaText.Caption>
      <Space y={16} />
    </View>
  )

  return (
    <Popable
      ref={ref}
      content={renderPopoverInfoText()}
      position={'top'}
      style={{ minWidth: width / 2 }}
      backgroundColor={theme.neutral100}>
      <InfoSVG color={theme.white} size={10} />
    </Popable>
  )
}

export default BridgeConfirmations
