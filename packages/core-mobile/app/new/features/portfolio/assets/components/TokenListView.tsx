import React from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  MaskedText,
  Text,
  useTheme,
  View,
  alpha,
  PriceChangeStatus
} from '@avalabs/k2-alpine'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useSelector } from 'react-redux'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

export const TokenListView = ({
  token,
  tokenNameForDisplay,
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

  const renderPriceChangeIndicator = (): JSX.Element | undefined => {
    if (
      priceChangeStatus === PriceChangeStatus.Neutral ||
      formattedBalance === undefined
    )
      return undefined

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
    <View>
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
          <LogoWithNetwork
            token={token}
            outerBorderColor={colors.$surfaceSecondary}
          />
          <View
            sx={{
              flexGrow: 1,
              flexShrink: 1,
              marginHorizontal: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
            <View
              sx={{
                flexShrink: 1,
                gap: 1
              }}>
              <Text
                variant="buttonMedium"
                numberOfLines={1}
                sx={{ flex: 1 }}
                testID={`portfolio_token_item__${tokenNameForDisplay}`}>
                {tokenNameForDisplay}
              </Text>
              <MaskedText
                shouldMask={isPrivacyModeEnabled}
                maskWidth={55}
                sx={{ lineHeight: 16, flex: 1 }}
                ellipsizeMode="tail"
                numberOfLines={1}
                testID={`list_token_balance__${index}`}>
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
            <View
              sx={{
                flexShrink: 1,
                alignItems: 'flex-end',
                gap: 2
              }}>
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
                {isPrivacyModeEnabled ? (
                  <HiddenBalanceText
                    variant="buttonMedium"
                    sx={{ lineHeight: 18 }}
                  />
                ) : (
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ lineHeight: 18 }}
                    testID={`list_fiat_balance__${index}`}>
                    {formattedBalance}
                  </Text>
                )}
              </View>
              {renderPriceChangeIndicator()}
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
    </View>
  )
}
