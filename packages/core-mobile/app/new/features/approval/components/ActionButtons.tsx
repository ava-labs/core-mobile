import {
  ActivityIndicator,
  Button,
  Icons,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { AlertType } from '@avalabs/vm-module-types'
import { HORIZONTAL_MARGIN } from 'new/common/consts'
import React, { useCallback, useMemo, useState } from 'react'

type Alert = {
  type: AlertType
  message: string
}

export type ActionButtonsProps = {
  confirm: {
    label: string
    onPress: () => void
    disabled?: boolean
    isLoading?: boolean
  }
  cancel: {
    label: string
    onPress: () => void
    disabled?: boolean
  }
  alert?: Alert
}

export const ActionButtons = ({
  confirm,
  cancel,
  alert
}: ActionButtonsProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [alertConfirmed, setAlertConfirmed] = useState(false)

  const containerStyle = useMemo(
    () => ({
      gap: 16
    }),
    []
  )

  const renderButtons = useCallback(() => {
    const shouldDisableConfirm =
      (alert && alert.type === AlertType.DANGER && !alertConfirmed) ||
      confirm.disabled

    return (
      <View>
        <Button
          size="large"
          type="primary"
          onPress={() => confirm.onPress()}
          disabled={shouldDisableConfirm}>
          {confirm.isLoading ? <ActivityIndicator /> : confirm.label}
        </Button>
        <Button
          size="large"
          type="tertiary"
          style={{ marginTop: 16 }}
          onPress={() => cancel.onPress()}
          disabled={cancel.disabled}>
          {cancel.label}
        </Button>
      </View>
    )
  }, [confirm, cancel, alert, alertConfirmed])

  const renderIcon = useCallback(
    (alertType: AlertType) => {
      if (alertType === AlertType.DANGER) {
        return <Icons.Social.RemoveModerator color={colors.$textDanger} />
      } else if (alertType === AlertType.WARNING) {
        return (
          <Icons.Device.GPPMaybe
            color={colors.$textPrimary}
            width={20}
            height={20}
          />
        )
      } else {
        return (
          <Icons.Action.Info
            color={colors.$textPrimary}
            width={20}
            height={20}
          />
        )
      }
    },
    [colors.$textDanger, colors.$textPrimary]
  )

  const renderAlertSection = useCallback(
    (alertData: Alert) => {
      const isDangerAlert = alertData.type === AlertType.DANGER

      return (
        <View>
          <View
            sx={{
              borderTopWidth: 1,
              borderTopColor: '$borderPrimary',
              marginHorizontal: -HORIZONTAL_MARGIN
            }}
          />
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingTop: 20,
              marginBottom: 22
            }}>
            <View style={{ alignSelf: 'center' }}>
              {renderIcon(alertData.type)}
            </View>
            <View
              sx={{
                flex: 1,
                marginLeft: 8,
                marginRight: isDangerAlert ? 31 : 10
              }}>
              <Text
                variant="buttonMedium"
                sx={{
                  fontSize: 13,
                  textAlign: 'left',
                  color: isDangerAlert ? '$textDanger' : '$textPrimary'
                }}>
                {alertData.message}
              </Text>
            </View>
            {isDangerAlert && (
              <Toggle
                value={alertConfirmed}
                onValueChange={setAlertConfirmed}
              />
            )}
          </View>
          {renderButtons()}
        </View>
      )
    },
    [renderButtons, alertConfirmed, renderIcon]
  )

  const renderDefaultSection = useCallback(
    () => renderButtons(),
    [renderButtons]
  )

  return (
    <View sx={containerStyle}>
      {alert ? renderAlertSection(alert) : renderDefaultSection()}
    </View>
  )
}
