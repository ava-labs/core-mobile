import React, { FC, useContext } from 'react'
import { View } from 'react-native'
import { ApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import AvaText from 'components/AvaText'
import OvalTagBg from 'components/OvalTagBg'
import { displaySeconds } from 'utils/Utils'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import ConfirmationTracker from 'screens/bridge/components/ConfirmationTracker'

interface Props {
  paddingHorizontal?: number
  confirmationCount: number
  requiredConfirmationCount: number
  complete: boolean
  tickerSeconds: number
  started: boolean
}

const BridgeConfirmations: FC<Props> = ({
  confirmationCount,
  requiredConfirmationCount,
  complete,
  tickerSeconds,
  paddingHorizontal = 16,
  started = false
}) => {
  const theme = useContext(ApplicationContext).theme
  return (
    <View>
      <AvaListItem.Base
        title={'Confirmations'}
        rightComponent={
          <Row style={{ alignItems: 'center' }}>
            <AvaText.Heading3 textStyle={{ marginEnd: 8 }}>
              {confirmationCount > // to avoid showing 16/15 since confirmations keep going up
              requiredConfirmationCount
                ? requiredConfirmationCount
                : confirmationCount}
              /{requiredConfirmationCount}
            </AvaText.Heading3>
            <OvalTagBg
              style={{
                borderRadius: 50,
                paddingHorizontal: 6,
                paddingVertical: 4,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: complete ? theme.colorSuccess : theme.colorBg3
              }}>
              <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
                {displaySeconds(tickerSeconds)}
                {complete && (
                  <>
                    {' '}
                    <CheckmarkSVG color={theme.white} size={10} />
                  </>
                )}
              </AvaText.ButtonSmall>
            </OvalTagBg>
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

export default BridgeConfirmations
