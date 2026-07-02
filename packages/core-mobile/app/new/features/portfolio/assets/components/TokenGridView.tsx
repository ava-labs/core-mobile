import {
  alpha,
  AnimatedPressable,
  Icons,
  MaskedText,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { GRID_GAP } from 'common/consts'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import React from 'react'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

const SCREEN_WIDTH = Dimensions.get('window').width

// FlashList v2's `numColumns` is a flexWrap layout that requires every cell to
// have the same height (masonry is a separate, opt-in prop), otherwise adjacent
// cells go ragged and the grid staggers. We pin a uniform card height and lay
// the card out as a flex column: the top block (logo + name + token balance)
// flows from the top, and the balance block (fiat value + price-change) is
// anchored to the bottom-left via `marginTop: 'auto'`, so the important values
// always sit at the same baseline regardless of how tall the top content is.
// Only the height is constant — the WIDTH stays device-responsive.
export const GRID_CARD_HEIGHT = 180

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
      return <Text variant="buttonSmall" /> // empty to maintain layout consistency in grid view

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
    <Animated.View>
      <AnimatedPressable onPress={onPress}>
        <View
          sx={{
            borderRadius: 18,
            padding: 16,
            backgroundColor: '$surfaceSecondary',
            gap: 8,
            width: (SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2,
            height: GRID_CARD_HEIGHT,
            overflow: 'hidden'
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
            <View
              testID={`grid_token_balance__${index}`}
              sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <MaskedText
                shouldMask={isPrivacyModeEnabled}
                maskWidth={65}
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ lineHeight: 16 }}>
                <View sx={{ flexDirection: 'row' }}>
                  <SubTextNumber
                    number={token.balanceDisplayValue}
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
          {/* Anchored to the card's bottom-left: `marginTop: 'auto'` absorbs the
              free space so the fiat balance + price-change always sit on the
              same baseline across cells of the fixed-height grid. */}
          <View sx={{ marginTop: 'auto' }}>
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
