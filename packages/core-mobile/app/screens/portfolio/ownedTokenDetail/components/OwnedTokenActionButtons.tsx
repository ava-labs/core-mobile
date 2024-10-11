import { Button, Icons, Text, TouchableOpacity, View } from '@avalabs/k2-mobile'
import { Row } from 'components/Row'
import React from 'react'
import SwapIcon from 'assets/icons/swap.svg'
import { theme } from '@avalabs/k2-mobile/src/theme/theme'
import BridgeSVG from 'components/svg/BridgeSVG'
import ArrowOutward from 'assets/icons/arrow_outward.svg'

const OwnedTokenActionButtons = ({
  showSwap,
  showBridge,
  onSwap,
  onBridge,
  onSend,
  onReceive
}: {
  showSwap: boolean
  showBridge: boolean
  onSwap: () => void
  onBridge: () => void
  onSend: () => void
  onReceive: () => void
}): JSX.Element => {
  if (!showSwap && !showBridge) {
    return (
      <Row style={{ gap: 16 }}>
        <Button
          testID="send_token_action_btn"
          type="secondary"
          size="large"
          style={{ flex: 1 }}
          onPress={onSend}>
          Send
        </Button>
        <Button
          testID="receive_token_action_btn"
          type="secondary"
          size="large"
          style={{ flex: 1 }}
          onPress={onReceive}>
          Receive
        </Button>
      </Row>
    )
  }

  return (
    <Row style={{ gap: 10 }}>
      <ActionButton
        testID="send_token_action_btn"
        icon={<ArrowOutward />}
        text="Send"
        onPress={onSend}
      />
      <ActionButton
        testID="receive_token_action_btn"
        icon={
          <View sx={{ padding: 2 }}>
            <Icons.Communication.IconQRCode
              width={20}
              height={20}
              color={theme.colors.$white}
            />
          </View>
        }
        text="Receive"
        onPress={onReceive}
      />
      {showBridge && (
        <ActionButton
          testID="bridge_token_action_btn"
          icon={
            <View sx={{ padding: 3 }}>
              <BridgeSVG color={theme.colors.$white} size={18} />
            </View>
          }
          text="Bridge"
          onPress={onBridge}
        />
      )}
      {showSwap && (
        <ActionButton
          testID="swap_token_action_btn"
          icon={<SwapIcon color={theme.colors.$white} style={{ margin: 4 }} />}
          text="Swap"
          onPress={onSwap}
        />
      )}
    </Row>
  )
}

const ActionButton = ({
  text,
  icon,
  onPress,
  testID
}: {
  text: string
  icon: JSX.Element
  onPress: () => void
  testID?: string
}): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        sx={{
          backgroundColor: '$neutral800',
          gap: 12,
          borderRadius: 16,
          width: 75,
          height: 75
        }}>
        <View sx={{ position: 'absolute', top: 10, left: 8 }}>{icon}</View>
        <Text
          testID={testID}
          sx={{
            fontSize: 13,
            lineHeight: 21,
            position: 'absolute',
            left: 13,
            bottom: 7
          }}>
          {text}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default OwnedTokenActionButtons
