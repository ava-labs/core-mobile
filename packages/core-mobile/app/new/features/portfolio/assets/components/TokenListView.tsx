import React, { useMemo } from 'react'
import {
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  MaskedText,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { useSelector } from 'react-redux'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import {
  CHAIN_IDS_WITH_INCORRECT_SYMBOL,
  CHAIN_IDS_WITH_INCORRECT_SYMBOL_MAPPING
} from 'consts/chainIdsWithIncorrectSymbol'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenType } from '@avalabs/vm-module-types'
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
  const { allNetworks } = useNetworks()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)

  const tokenName = useMemo(() => {
    if (
      CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(token.networkChainId) &&
      token.type === TokenType.NATIVE
    ) {
      return allNetworks[token.networkChainId]?.chainName ?? token.name
    }
    return token.name
  }, [allNetworks, token.name, token.networkChainId, token.type])

  const tokenSymbol = useMemo(() => {
    if (
      CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(token.networkChainId) &&
      token.type === TokenType.NATIVE
    ) {
      return (
        CHAIN_IDS_WITH_INCORRECT_SYMBOL_MAPPING[
          token.networkChainId as keyof typeof CHAIN_IDS_WITH_INCORRECT_SYMBOL_MAPPING
        ] ?? token.symbol
      )
    }
    return token.symbol
  }, [token.networkChainId, token.symbol, token.type])

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
                {tokenName}
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
                {token.balanceDisplayValue} {tokenSymbol}
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
    </View>
  )
}
