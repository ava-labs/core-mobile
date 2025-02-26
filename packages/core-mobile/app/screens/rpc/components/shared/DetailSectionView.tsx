import React from 'react'
import { Text, TouchableOpacity, View } from '@avalabs/k2-mobile'
import {
  AddressItem,
  CurrencyItem,
  DataItem,
  DateItem,
  DetailItemType,
  DetailSection,
  FundsRecipientItem,
  LinkItem,
  NodeIDItem,
  TextItem
} from '@avalabs/vm-module-types'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { bigIntToString, TokenUnit } from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { NodeID } from 'components/NodeID'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'

export const DetailSectionView = ({
  detailSection,
  onPressDataItem
}: {
  detailSection: DetailSection
  onPressDataItem: (data: string) => void
}): JSX.Element => {
  const { getMarketTokenBySymbol } = useWatchlist()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

  const renderPlainText = (item: string, key: React.Key): JSX.Element => (
    <View key={key}>
      <Text variant="body2">{item}</Text>
    </View>
  )

  const renderTextItem = (item: TextItem, key: React.Key): JSX.Element => (
    <Row
      style={
        item.alignment === 'horizontal'
          ? {
              justifyContent: 'space-between',
              alignItems: 'center'
            }
          : {
              flexDirection: 'column'
            }
      }
      key={key}>
      <Text variant="caption">{item.label}</Text>
      <Text variant="buttonSmall" testID={`${item.label}_${item.value}`}>
        {item.value}
      </Text>
    </Row>
  )

  const renderLinkItem = (item: LinkItem, key: React.Key): JSX.Element => (
    <Row
      style={{
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
      key={key}>
      <Text variant="caption">{item.label}</Text>
      <Text variant="buttonSmall">{new URL(item.value.url).hostname}</Text>
    </Row>
  )

  const renderDataValue = (data: string): JSX.Element => (
    <TouchableOpacity hitSlop={12} onPress={() => onPressDataItem(data)}>
      <Text variant="buttonSmall" sx={{ color: '$blueDark' }}>
        View
      </Text>
    </TouchableOpacity>
  )

  const renderCurrencyValue = (
    value: bigint,
    decimals: number,
    symbol: string
  ): JSX.Element => {
    const marketToken = getMarketTokenBySymbol(symbol)

    return (
      <View sx={{ alignItems: 'flex-end' }}>
        <Text variant="buttonSmall" testID="token_amount">
          {new TokenUnit(value, decimals, symbol).toDisplay()} {symbol}
        </Text>
        {marketToken?.currentPrice !== undefined && (
          <Text variant="caption" sx={{ color: '$neutral400' }}>
            {`${tokenInCurrencyFormatter(
              Number(bigIntToString(value, decimals)) * marketToken.currentPrice
            )} ${selectedCurrency}`}
          </Text>
        )}
      </View>
    )
  }

  const renderValue = (
    item:
      | AddressItem
      | NodeIDItem
      | CurrencyItem
      | DataItem
      | DateItem
      | FundsRecipientItem
  ): JSX.Element => {
    return item.type === DetailItemType.ADDRESS ? (
      <TokenAddress address={item.value} />
    ) : item.type === DetailItemType.NODE_ID ? (
      <NodeID nodeID={item.value} />
    ) : item.type === DetailItemType.DATA ? (
      renderDataValue(item.value)
    ) : item.type === DetailItemType.DATE ? (
      <Text variant="buttonSmall">
        {getDateInMmmDdYyyyHhMmA(parseInt(item.value))}
      </Text>
    ) : item.type === DetailItemType.CURRENCY ? (
      renderCurrencyValue(item.value, item.maxDecimals, item.symbol)
    ) : (
      renderCurrencyValue(item.amount, item.maxDecimals, item.symbol)
    )
  }

  return (
    <View>
      {detailSection.title && (
        <View sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="buttonMedium">{detailSection.title}</Text>
        </View>
      )}
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 12,
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          gap: 8,
          backgroundColor: '$neutral800'
        }}>
        {detailSection.items.map((item, index) => {
          if (typeof item === 'string') {
            return renderPlainText(item, index)
          } else if (item.type === DetailItemType.TEXT) {
            return renderTextItem(item, index)
          } else if (item.type === DetailItemType.LINK) {
            return renderLinkItem(item, index)
          }

          return (
            <Row
              style={{
                justifyContent: 'space-between',
                alignItems:
                  item.type === DetailItemType.CURRENCY
                    ? 'flex-start'
                    : 'center',
                gap: 12
              }}
              key={index}>
              <Text
                sx={{ flexShrink: 1 }}
                numberOfLines={1}
                ellipsizeMode="middle"
                variant="caption">
                {item.label}
              </Text>
              {renderValue(item)}
            </Row>
          )
        })}
      </View>
    </View>
  )
}
