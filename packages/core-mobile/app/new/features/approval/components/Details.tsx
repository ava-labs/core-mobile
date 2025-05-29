import React, { useCallback, useMemo } from 'react'
import {
  alpha,
  Icons,
  Pressable,
  Separator,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import {
  AddressItem,
  AddressListItem,
  CurrencyItem,
  DataItem,
  DateItem,
  DetailItem,
  DetailItemType,
  DetailSection,
  FundsRecipientItem,
  LinkItem,
  NetworkItem,
  NodeIDItem,
  TextItem
} from '@avalabs/vm-module-types'
import {
  bigIntToString,
  TokenUnit,
  truncateAddress
} from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { copyToClipboard } from 'new/common/utils/clipboard'
import { truncateNodeId } from 'utils/Utils'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { toSentenceCase } from 'common/utils/toSentenceCase'
import { TokenLogo } from 'common/components/TokenLogo'
import { FlatList } from 'react-native'

export const Details = ({
  detailSection,
  symbol
}: {
  detailSection: DetailSection
  symbol?: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatTokenInCurrency } = useFormatCurrency()

  const valueTextColor = useMemo(
    () => alpha(colors.$textPrimary, 0.6),
    [colors.$textPrimary]
  )

  const renderPlainText = useCallback(
    (item: string, key: React.Key): JSX.Element => (
      <View key={key}>
        <Text
          variant="subtitle2"
          sx={{
            fontSize: 16,
            lineHeight: 18,
            color: valueTextColor
          }}>
          {item}
        </Text>
      </View>
    ),
    [valueTextColor]
  )

  const renderTextItem = useCallback(
    (item: TextItem, key: React.Key): JSX.Element => {
      const isHorizontal = item.alignment === 'horizontal'

      return (
        <View
          style={
            isHorizontal
              ? {
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'row'
                }
              : {
                  flexDirection: 'column',
                  alignItems: 'flex-start'
                }
          }
          key={key}>
          <Text
            variant="body1"
            sx={{
              fontSize: 16,
              lineHeight: 22,
              color: '$textPrimary'
            }}>
            {item.label}
          </Text>
          <Text
            variant="body1"
            numberOfLines={isHorizontal ? 1 : undefined}
            sx={{
              flex: isHorizontal ? 1 : 0,
              fontSize: 16,
              lineHeight: 22,
              color: valueTextColor,
              textAlign: isHorizontal ? 'right' : 'left'
            }}
            testID={`${item.label}_${item.value}`}>
            {item.value}
          </Text>
        </View>
      )
    },
    [valueTextColor]
  )

  const renderAddress = useCallback(
    (address: string): JSX.Element => (
      <Pressable
        onPress={() => {
          copyToClipboard(address, 'Address copied')
        }}>
        <Text
          variant="mono"
          numberOfLines={1}
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: valueTextColor
          }}>
          {truncateAddress(address, 8)}
        </Text>
      </Pressable>
    ),
    [valueTextColor]
  )

  const renderNodeIDItem = useCallback(
    (item: NodeIDItem): JSX.Element => (
      <Pressable
        onPress={() => {
          copyToClipboard(item.value, 'Node ID copied')
        }}>
        <Text
          variant="mono"
          numberOfLines={1}
          style={{
            fontSize: 15,
            lineHeight: 22,
            color: valueTextColor
          }}>
          {truncateNodeId(item.value, 8)}
        </Text>
      </Pressable>
    ),
    [valueTextColor]
  )

  const renderLinkItem = useCallback(
    (item: LinkItem, key: React.Key): JSX.Element => (
      <View
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row'
        }}
        key={key}>
        <Text
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 22,
            color: '$textPrimary'
          }}
          testID={`${item.label}_${item.value}`}>
          {item.label}
        </Text>
        <Text
          variant="body1"
          numberOfLines={1}
          sx={{
            flex: 1,
            marginLeft: 12,
            fontSize: 16,
            lineHeight: 22,
            color: valueTextColor,
            textAlign: 'right'
          }}>
          {new URL(item.value.url).hostname}
        </Text>
      </View>
    ),
    [valueTextColor]
  )

  const renderDataValue = useCallback(
    (data: string): JSX.Element => (
      <TouchableOpacity
        hitSlop={24}
        onPress={() => {
          showAlert({
            title: `Transaction Data (${getHexStringToBytes(data)} Bytes)`,
            description: data,
            buttons: [
              {
                text: 'Got it'
              }
            ]
          })
        }}>
        <Icons.Navigation.ChevronRight color={valueTextColor} />
      </TouchableOpacity>
    ),
    [valueTextColor]
  )

  const renderCurrencyValue = useCallback(
    (value: bigint, decimals: number, s: string): JSX.Element => {
      const marketToken = getMarketTokenBySymbol(s)
      return (
        <View sx={{ alignItems: 'flex-end' }}>
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              fontSize: 16,
              lineHeight: 22,
              color: valueTextColor
            }}
            testID="token_amount">
            {new TokenUnit(value, decimals, s).toDisplay()} {s}
          </Text>
          {marketToken?.currentPrice !== undefined && (
            <Text
              variant="body1"
              numberOfLines={1}
              sx={{
                fontSize: 11,
                lineHeight: 14,
                color: valueTextColor
              }}>
              {`${formatTokenInCurrency({
                amount:
                  Number(bigIntToString(value, decimals)) *
                  marketToken.currentPrice
              })} ${selectedCurrency}`}
            </Text>
          )}
        </View>
      )
    },
    [
      getMarketTokenBySymbol,
      formatTokenInCurrency,
      selectedCurrency,
      valueTextColor
    ]
  )

  const renderNetworkValue = useCallback(
    (item: NetworkItem): JSX.Element => {
      return (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            maxWidth: '80%',
            flex: 1,
            justifyContent: 'flex-end'
          }}>
          <TokenLogo logoUri={item.value.logoUri} symbol={symbol} size={24} />
          <Text
            variant="body1"
            numberOfLines={1}
            sx={{
              fontSize: 16,
              lineHeight: 22,
              color: alpha(colors.$textPrimary, 0.6)
            }}>
            {item.value.name}
          </Text>
        </View>
      )
    },
    [colors.$textPrimary, symbol]
  )

  const renderValue = useCallback(
    (
      item:
        | AddressItem
        | NodeIDItem
        | CurrencyItem
        | DataItem
        | DateItem
        | FundsRecipientItem
        | AddressListItem
        | NetworkItem
      // eslint-disable-next-line sonarjs/cognitive-complexity
    ): JSX.Element | null => {
      return item.type === DetailItemType.ADDRESS ? (
        renderAddress(item.value)
      ) : item.type === DetailItemType.NODE_ID ? (
        renderNodeIDItem(item)
      ) : item.type === DetailItemType.DATA ? (
        renderDataValue(item.value)
      ) : item.type === DetailItemType.DATE ? (
        <Text
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 22,
            color: valueTextColor
          }}>
          {getDateInMmmDdYyyyHhMmA(parseInt(item.value))}
        </Text>
      ) : item.type === DetailItemType.CURRENCY ? (
        renderCurrencyValue(item.value, item.maxDecimals, item.symbol)
      ) : item.type === DetailItemType.FUNDS_RECIPIENT ? (
        renderCurrencyValue(item.amount, item.maxDecimals, item.symbol)
      ) : item.type === DetailItemType.NETWORK ? (
        renderNetworkValue(item)
      ) : null
    },
    [
      renderCurrencyValue,
      renderAddress,
      renderNodeIDItem,
      renderDataValue,
      valueTextColor,
      renderNetworkValue
    ]
  )

  const renderSeparator = useCallback((): JSX.Element => <Separator />, [])

  const renderFundReceipientItem = useCallback(
    (item: FundsRecipientItem, key: React.Key): JSX.Element => (
      <View key={key}>
        <View
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            paddingBottom: VERTICAL_PADDING
          }}>
          <Text
            variant="body1"
            sx={{
              fontSize: 16,
              lineHeight: 22,
              color: '$textPrimary'
            }}>
            Recipient
          </Text>
          {renderAddress(item.label)}
        </View>
        {renderSeparator()}
        <View sx={{ paddingTop: VERTICAL_PADDING }}>
          {renderCurrencyValue(item.amount, item.maxDecimals, item.symbol)}
        </View>
      </View>
    ),
    [renderSeparator, renderCurrencyValue, renderAddress]
  )

  const renderItem = useCallback(
    (item: DetailItem, index: number) => {
      let content

      if (typeof item === 'string') {
        content = renderPlainText(item, index)
      } else if (item.type === DetailItemType.TEXT) {
        content = renderTextItem(item, index)
      } else if (item.type === DetailItemType.LINK) {
        content = renderLinkItem(item, index)
      } else if (item.type === DetailItemType.FUNDS_RECIPIENT) {
        content = renderFundReceipientItem(item, index)
      } else {
        content = (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems:
                item.type === DetailItemType.CURRENCY ? 'flex-start' : 'center',
              gap: 12
            }}
            key={index}>
            <View
              style={{
                alignSelf: 'center'
              }}>
              <Text
                variant="body1"
                ellipsizeMode="middle"
                numberOfLines={1}
                sx={{
                  fontSize: 16,
                  lineHeight: 22,
                  color: '$textPrimary'
                }}>
                {toSentenceCase(item.label)}
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                alignItems: 'flex-end'
              }}>
              {renderValue(item)}
            </View>
          </View>
        )
      }

      return (
        <View>
          <View sx={{ paddingVertical: VERTICAL_PADDING }}>{content}</View>
        </View>
      )
    },
    [
      renderPlainText,
      renderTextItem,
      renderLinkItem,
      renderValue,
      renderFundReceipientItem
    ]
  )

  return (
    <View
      sx={{
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginTop: 12
      }}>
      <FlatList
        scrollEnabled={false}
        data={detailSection.items}
        renderItem={({ item, index }) => renderItem(item, index)}
        keyExtractor={(_item, index) => index.toString()}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  )
}

const VERTICAL_PADDING = 13
