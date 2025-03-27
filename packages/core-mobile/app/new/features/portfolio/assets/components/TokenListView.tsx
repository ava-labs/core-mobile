import React from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  MaskedText,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useSelector } from 'react-redux'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

export const TokenListView = ({
  token,
  index,
  onPress,
  formattedBalance,
  formattedPrice,
  priceChangeStatus
}: TokenListViewProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
      <AnimatedPressable onPress={onPress}>
        <View
          sx={{
            borderRadius: 18,
            paddingLeft: 16,
            paddingRight: 12,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '$surfaceSecondary'
          }}>
          <LogoWithNetwork token={token} />
          <View
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              marginHorizontal: 12
            }}>
            <View
              sx={{
                flexShrink: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24
              }}>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ flex: 1 }}
                testID={`list_token_name__${index}`}>
                {token.name}
              </Text>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 1
                }}>
                {!token.isDataAccurate && !isPrivacyModeEnabled && (
                  <Icons.Alert.Error
                    width={16}
                    height={16}
                    color={colors.$textDanger}
                  />
                )}
                <MaskedText
                  variant="buttonMedium"
                  shouldMask={isPrivacyModeEnabled}
                  maskWidth={64}
                  numberOfLines={1}
                  sx={{ lineHeight: 18 }}
                  testID={`list_fiat_balance__${index}`}>
                  {formattedBalance}
                </MaskedText>
              </View>
            </View>
            <View
              sx={{
                flexDirection: 'row',
                flexShrink: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 24
              }}>
              <MaskedText
                shouldMask={isPrivacyModeEnabled}
                maskWidth={55}
                sx={{ lineHeight: 16, flex: 1 }}
                ellipsizeMode="tail"
                numberOfLines={1}
                testID={`list_token_balance__${index}`}>
                {token.balanceDisplayValue} {token.symbol}
              </MaskedText>
              <PriceChangeIndicator
                formattedPrice={formattedPrice}
                status={priceChangeStatus}
                shouldMask={isPrivacyModeEnabled}
                maskWidth={40}
              />
            </View>
          </View>
          <View
            sx={{
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            <Icons.Navigation.ChevronRightV2 color={colors.$textSecondary} />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}
