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
          type="secondary"
          size="large"
          style={{ flex: 1 }}
          onPress={onSend}>
          Send
        </Button>
        <Button
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
      <ActionButton icon={<ArrowOutward />} text="Send" onPress={onSend} />
      <ActionButton
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
  onPress
}: {
  text: string
  icon: JSX.Element
  onPress: () => void
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
