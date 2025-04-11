import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import React, { useMemo, useState, useEffect } from 'react'
import {
  CircularButton,
  Icons,
  TouchableOpacity,
  Image,
  CIRCULAR_BUTTON_WIDTH,
  Text,
  View
} from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SMS from 'expo-sms'
import Logger from 'utils/Logger'
import { Social } from 'react-native-share'
import { Platform, ImageRequireSource, Linking } from 'react-native'

const smsIcon = require('../../../assets/icons/messages.png')
const xIcon = require('../../../assets/icons/x.png')

export const ShareFooter = ({
  url,
  onCopyLink,
  onMore,
  onSendMessage,
  onShare
}: {
  url?: string
  onCopyLink: (link: string | undefined) => void
  onMore: () => void
  onSendMessage: () => void
  onShare: (social: AvailableSocial) => void
}): JSX.Element | null => {
  const { bottom } = useSafeAreaInsets()
  const [canSendSMS, setCanSendSMS] = useState(false)
  const [canShareTwitter, setCanShareTwitter] = useState(false)

  const actions = useMemo(() => {
    const result = [
      <CircularButton title="More" key="more" onPress={onMore}>
        <Icons.Navigation.MoreHoriz />
      </CircularButton>
    ]
    if (url) {
      result.unshift(
        <CircularButton
          title="Copy link"
          key="copy-link"
          onPress={() => onCopyLink(url)}>
          <Icons.Content.Link style={{ transform: [{ rotate: '-45deg' }] }} />
        </CircularButton>
      )
    }

    if (canSendSMS) {
      result.push(
        <ActionButton
          onPress={onSendMessage}
          title="Messages"
          key="send-message">
          <Image
            source={smsIcon}
            sx={{ width: CIRCULAR_BUTTON_WIDTH, height: CIRCULAR_BUTTON_WIDTH }}
          />
        </ActionButton>
      )
    }

    const socials: {
      icon: ImageRequireSource
      type: AvailableSocial
      title: string
      key: string
    }[] = canShareTwitter
      ? [
          {
            icon: xIcon,
            type: Social.Twitter,
            title: 'X',
            key: 'x'
          }
        ]
      : []

    socials.forEach(({ icon, type, title, key }) => {
      result.push(
        <ActionButton onPress={() => onShare(type)} title={title} key={key}>
          <Image
            source={icon}
            sx={{ width: CIRCULAR_BUTTON_WIDTH, height: CIRCULAR_BUTTON_WIDTH }}
          />
        </ActionButton>
      )
    })

    return result
  }, [
    onMore,
    onCopyLink,
    onSendMessage,
    onShare,
    url,
    canSendSMS,
    canShareTwitter
  ])

  useEffect(() => {
    SMS.isAvailableAsync()
      .then(result => setCanSendSMS(result))
      .catch(Logger.error)
  }, [])

  useEffect(() => {
    // twitter sharing via react-native-share doesn't work on Android.
    if (Platform.OS === 'ios') {
      Linking.canOpenURL('twitter://')
        .then(result => {
          setCanShareTwitter(result)
        })
        .catch(Logger.error)
    }
  }, [])

  if (actions.length === 0) {
    return null
  }

  return (
    <LinearGradientBottomWrapper>
      <View sx={{ alignItems: 'center' }}>
        <View
          sx={{
            paddingBottom: bottom + 12,
            flexDirection: 'row',
            paddingHorizontal: 28,
            gap: 20
          }}>
          {actions}
        </View>
      </View>
    </LinearGradientBottomWrapper>
  )
}

const ActionButton: React.FC<{
  title?: string
  testID?: string
  onPress: () => void
  children: React.ReactNode
}> = ({ title, testID, onPress, children }): JSX.Element => {
  return (
    <TouchableOpacity onPress={onPress} accessible={false} testID={testID}>
      <View
        sx={{
          gap: 8,
          alignItems: 'center'
        }}>
        <View sx={{ borderRadius: 18, overflow: 'hidden' }}>{children}</View>
        {title && <Text variant="subtitle2">{title}</Text>}
      </View>
    </TouchableOpacity>
  )
}

export type AvailableSocial = Social.Twitter
