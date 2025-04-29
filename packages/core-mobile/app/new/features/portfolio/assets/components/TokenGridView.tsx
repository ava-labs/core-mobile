import React from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  MaskedText,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import { GRID_GAP } from 'common/consts'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useSelector } from 'react-redux'
import { TokenListViewProps } from '../types'
import { LogoWithNetwork } from './LogoWithNetwork'

const SCREEN_WIDTH = Dimensions.get('window').width

export const TokenGridView = ({
  token,
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

  return (
    <View>
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
              testID={`grid_token_name__${index}`}
              variant="buttonMedium"
              numberOfLines={1}
              sx={{ lineHeight: 16 }}>
              {token.name}
            </Text>
            <View sx={{ flexDirection: 'row', flexShrink: 1 }}>
              <MaskedText
                testID={`grid_token_balance__${index}`}
                shouldMask={isPrivacyModeEnabled}
                maskWidth={65}
                numberOfLines={1}
                ellipsizeMode="tail"
                sx={{ lineHeight: 16 }}>
                {token.balanceDisplayValue} {token.symbol}
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
                <MaskedText
                  testID={`grid_fiat_balance__${index}`}
                  variant="buttonLarge"
                  shouldMask={isPrivacyModeEnabled}
                  maskWidth={85}
                  numberOfLines={1}
                  sx={{ lineHeight: 21 }}>
                  {formattedBalance}
                </MaskedText>
              </View>
              <PriceChangeIndicator
                shouldMask={isPrivacyModeEnabled}
                maskWidth={40}
                formattedPrice={formattedPrice}
                status={priceChangeStatus}
              />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  )
}
