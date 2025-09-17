import {
  alpha,
  AnimatedPressable,
  Icons,
  MaskedText,
  PriceChangeIndicator,
  PriceChangeStatus,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { GRID_GAP } from 'common/consts'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import React from 'react'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

const SCREEN_WIDTH = Dimensions.get('window').width

export const TokenGridView = ({
  token,
  tokenNameForDisplay,
  index,
  onPress,
  priceChangeStatus,
  formattedBalance,
  formattedPrice
}: TokenListViewProps): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const {
    theme: { colors }
  } = useTheme()

  const renderPriceChangeIndicator = (): JSX.Element => {
    if (
      priceChangeStatus === PriceChangeStatus.Neutral ||
      formattedBalance === undefined
    )
      return <Text variant="buttonSmall" />

    if (priceChangeStatus === undefined)
      return <Text variant="buttonSmall">{UNKNOWN_AMOUNT}</Text>

    return (
      <PriceChangeIndicator
        shouldMask={isPrivacyModeEnabled}
        maskWidth={40}
        formattedPrice={formattedPrice}
        status={priceChangeStatus}
      />
    )
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={SPRING_LINEAR_TRANSITION}>
      <AnimatedPressable onPress={onPress}>
        <View
          sx={{
            borderRadius: 18,
            padding: 16,
            backgroundColor: '$surfaceSecondary',
            gap: 8,
            width: (SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2
          }}>
          <LogoWithNetwork
            token={token}
            outerBorderColor={colors.$surfaceSecondary}
          />
          <View>
            <Text
              testID={`portfolio_token_item__${tokenNameForDisplay}`}
              variant="buttonMedium"
              numberOfLines={1}
              sx={{ lineHeight: 16 }}>
              {tokenNameForDisplay}
            </Text>
            <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <MaskedText
                testID={`grid_token_balance__${index}`}
                shouldMask={isPrivacyModeEnabled}
                maskWidth={65}
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ lineHeight: 16 }}>
                <View sx={{ flexDirection: 'row' }}>
                  <SubTextNumber
                    number={Number(
                      token.balanceDisplayValue.replaceAll(',', '')
                    )}
                    textVariant="body2"
                  />
                  <Text
                    variant="body2"
                    sx={{
                      marginTop: 1,
                      color: alpha(colors.$textPrimary, 0.6)
                    }}>
                    {' ' + token.symbol}
                  </Text>
                </View>
              </MaskedText>
            </View>
          </View>
          <View sx={{ marginTop: 19 }}>
            <View>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  marginBottom: 1
                }}>
                {!token.isDataAccurate && !isPrivacyModeEnabled && (
                  <Icons.Alert.Error
                    width={16}
                    height={16}
                    color={colors.$textDanger}
                  />
                )}
                {isPrivacyModeEnabled ? (
                  <HiddenBalanceText
                    variant="buttonLarge"
                    sx={{ lineHeight: 21 }}
                  />
                ) : (
                  <Text
                    testID={`grid_fiat_balance__${index}`}
                    variant="buttonLarge"
                    numberOfLines={1}
                    sx={{ lineHeight: 21 }}>
                    {formattedBalance}
                  </Text>
                )}
              </View>
              {renderPriceChangeIndicator()}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}
