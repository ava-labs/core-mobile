import React, { FC, useEffect } from 'react'
import { Linking, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import OvalTagBg from 'components/OvalTagBg'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import ConfirmationTracker from 'screens/bridge/components/ConfirmationTracker'
import { useStopwatch } from 'react-timer-hook'
import { Blockchain } from '@avalabs/core-bridge-sdk'
import InfoSVG from 'components/svg/InfoSVG'
import { Space } from 'components/Space'
import { DOCS_BRIDGE_FAQS_URL } from 'resources/Constants'
import Logger from 'utils/Logger'
import { selectBridgeAppConfig } from 'store/bridge'
import { useSelector } from 'react-redux'
import { getFormattedDistance } from 'utils/date/getFormattedDistance'
import { Tooltip } from 'components/Tooltip'
import { Chain } from '@avalabs/bridge-unified'

interface Props {
  sourceChain?: Blockchain | Chain
  targetChain?: Blockchain | Chain
  paddingHorizontal?: number
  currentConfirmationCount: number
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
  isOffboardingBitcoin,
  startTime,
  endTime
}: {
  isOffboardingBitcoin: boolean
  startTime: number
  endTime?: number
}): JSX.Element {
  const theme = useApplicationContext().theme
  const { hours, minutes, seconds, reset } = useStopwatch({
    autoStart: !endTime,
    offsetTimestamp: padTimeElapsed(startTime, endTime)
  })

  const handleOpenFaq = (): void => {
    Linking.openURL(DOCS_BRIDGE_FAQS_URL).catch(e => {
      Logger.error(`failed to open ${DOCS_BRIDGE_FAQS_URL}`, e)
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

  const showInfoIcon = !complete && isOffboardingBitcoin

  const renderOvalTagBg = (): JSX.Element => {
    return (
      <OvalTagBg
        style={{
          ...styles.ovalTagBg,
          backgroundColor: complete ? theme.colorSuccess : theme.colorBg3
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
            <InfoSVG color={theme.white} size={10} />
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

  return showInfoIcon ? (
    <PopableInfo openFaq={handleOpenFaq}>{renderOvalTagBg()}</PopableInfo>
  ) : (
    renderOvalTagBg()
  )
}

const BridgeConfirmations: FC<Props> = ({
  sourceChain,
  targetChain,
  currentConfirmationCount,
  requiredConfirmationCount,
  startTime,
  endTime = 0,
  paddingHorizontal = 16,
  started = false
}) => {
  const isOffboardingBitcoin =
    sourceChain === Blockchain.AVALANCHE && targetChain === Blockchain.BITCOIN

  return (
    <View>
      <AvaListItem.Base
        title={<AvaText.Body2>Confirmations</AvaText.Body2>}
        titleAlignment="flex-start"
        rightComponent={
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Heading3 textStyle={{ marginEnd: 8 }}>
              {currentConfirmationCount}/{requiredConfirmationCount}
            </AvaText.Heading3>
            {startTime && (
              <ElapsedTimer
                startTime={startTime}
                endTime={endTime}
                isOffboardingBitcoin={isOffboardingBitcoin}
              />
            )}
          </Row>
        }
      />
      <View style={{ paddingHorizontal: paddingHorizontal }}>
        <ConfirmationTracker
          started={started}
          requiredCount={requiredConfirmationCount}
          currentCount={currentConfirmationCount}
        />
      </View>
    </View>
  )
}

const PopableInfo = ({
  openFaq,
  children
}: {
  openFaq: () => void
  children: JSX.Element
}): JSX.Element => {
  const theme = useApplicationContext().theme
  const width = useWindowDimensions().width
  const config = useSelector(selectBridgeAppConfig)

  const handleOnPress = (): void => {
    openFaq()
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
    <Tooltip
      content={renderPopoverInfoText()}
      style={{ width: width / 2 }}
      caretPosition="right"
      caretStyle={{ margin: 20 }}
      isLabelPopable>
      {children}
    </Tooltip>
  )
}

const styles = StyleSheet.create({
  ovalTagBg: {
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  }
})

export default BridgeConfirmations
