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
  CollapsibleGroupItem,
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
  TextItem,
  TransferListItem
} from '@avalabs/vm-module-types'
import {
  bigIntToString,
  TokenUnit,
  truncateAddress
} from '@avalabs/core-utils-sdk'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { getDateInMmmDdYyyyHhMmA } from 'utils/date/getDateInMmmDdYyyyHhMmA'
import { useGetMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { copyToClipboard } from 'new/common/utils/clipboard'
import { truncateNodeId } from 'utils/Utils'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { toSentenceCase } from 'common/utils/toSentenceCase'
import { TokenLogo } from 'common/components/TokenLogo'
import { FlatList } from 'react-native'
import { getTransferDetailItems } from '../utils/getTransferDetailItems'
import { CollapsibleDetailGroup } from './CollapsibleDetailGroup'

export const Details = ({
  detailSection,
  symbol,
  title
}: {
  detailSection: DetailSection
  symbol?: string
  title?: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const getMarketTokenBySymbol = useGetMarketTokenBySymbol()
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
          testID={`address__${address}`}
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
    ({
      value,
      decimals,
      symbol: s,
      showCurrencyValue = true
    }: {
      value: bigint
      decimals: number
      symbol: string
      showCurrencyValue?: boolean
    }): JSX.Element => {
      const marketToken = showCurrencyValue
        ? getMarketTokenBySymbol(s)
        : undefined

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
                  marketToken.currentPrice,
                withoutCurrencySuffix: true
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
            testID={`network__${item.value.name}`}
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

  const renderAddressList = useCallback(
    (addresses: string[]): JSX.Element => {
      const moreThanOneAddress = addresses.length > 1

      const copyableAddresses = moreThanOneAddress
        ? addresses.join(' ')
        : addresses[0]

      const addressCopiedMessage = moreThanOneAddress
        ? 'Addresses copied'
        : 'Address copied'

      return (
        <View sx={{ alignItems: 'flex-start' }}>
          {addresses.map((address, index) => (
            <Pressable
              key={index}
              onPress={() => {
                copyToClipboard(copyableAddresses, addressCopiedMessage)
              }}>
              <Text
                variant="mono"
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: valueTextColor,
                  marginBottom: index < addresses.length - 1 ? 4 : 0
                }}>
                {truncateAddress(address, 8)}
              </Text>
            </Pressable>
          ))}
        </View>
      )
    },
    [valueTextColor]
  )

  const renderAddressListItem = useCallback(
    (item: AddressListItem, key: React.Key): JSX.Element => (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12
        }}
        key={key}>
        <View
          style={{
            alignSelf: 'flex-start'
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
          {renderAddressList(item.value)}
        </View>
      </View>
    ),
    [renderAddressList]
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
        renderCurrencyValue({
          value: item.value,
          decimals: item.maxDecimals,
          symbol: item.symbol,
          showCurrencyValue: item.isNativeToken !== false
        })
      ) : item.type === DetailItemType.FUNDS_RECIPIENT ? (
        renderCurrencyValue({
          value: item.amount,
          decimals: item.maxDecimals,
          symbol: item.symbol
        })
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
          {renderCurrencyValue({
            value: item.amount,
            decimals: item.maxDecimals,
            symbol: item.symbol
          })}
        </View>
      </View>
    ),
    [renderSeparator, renderCurrencyValue, renderAddress]
  )

  const renderItemContent = useCallback(
    (item: RowItem, index: number): JSX.Element => {
      let content

      if (typeof item === 'string') {
        content = renderPlainText(item, index)
      } else if (item.type === DetailItemType.TEXT) {
        content = renderTextItem(item, index)
      } else if (item.type === DetailItemType.LINK) {
        content = renderLinkItem(item, index)
      } else if (item.type === DetailItemType.FUNDS_RECIPIENT) {
        content = renderFundReceipientItem(item, index)
      } else if (item.type === DetailItemType.ADDRESS_LIST) {
        content = renderAddressListItem(item, index)
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

      return content
    },
    [
      renderPlainText,
      renderTextItem,
      renderLinkItem,
      renderValue,
      renderFundReceipientItem,
      renderAddressListItem
    ]
  )

  const renderTransferList = useCallback(
    (item: TransferListItem): JSX.Element => {
      const nowInSeconds = Date.now() / 1000

      return (
        <View>
          {item.value.map((transfer, transferIndex) => (
            <View key={transferIndex}>
              {transferIndex > 0 && (
                <View sx={{ paddingVertical: TRANSFER_ROW_PADDING }}>
                  {renderSeparator()}
                </View>
              )}
              {getTransferDetailItems(transfer, nowInSeconds).map(
                (transferItem, index) => (
                  <View
                    key={index}
                    sx={{ paddingVertical: TRANSFER_ROW_PADDING }}>
                    {renderItemContent(transferItem, index)}
                  </View>
                )
              )}
            </View>
          ))}
        </View>
      )
    },
    [renderItemContent, renderSeparator]
  )

  const renderLeafItem = useCallback(
    (item: LeafItem, index: number): JSX.Element => {
      if (
        typeof item !== 'string' &&
        item.type === DetailItemType.TRANSFER_LIST
      ) {
        return (
          <View
            sx={{ paddingVertical: VERTICAL_PADDING - TRANSFER_ROW_PADDING }}>
            {renderTransferList(item)}
          </View>
        )
      }

      return (
        <View sx={{ paddingVertical: VERTICAL_PADDING }}>
          {renderItemContent(item, index)}
        </View>
      )
    },
    [renderItemContent, renderTransferList]
  )

  const renderNestedSection = useCallback(
    (section: DetailSection, sectionIndex: number): JSX.Element => (
      <View key={sectionIndex}>
        {renderSeparator()}
        {section.title?.trim() ? (
          <Text
            variant="buttonMedium"
            sx={{
              fontSize: 14,
              lineHeight: 20,
              color: '$textSecondary',
              paddingTop: VERTICAL_PADDING
            }}>
            {section.title}
          </Text>
        ) : null}
        {section.items.map((item, index) => {
          // never nest groups
          if (
            typeof item !== 'string' &&
            item.type === DetailItemType.COLLAPSIBLE_GROUP
          ) {
            return null
          }

          return (
            <View key={index}>
              {index > 0 && renderSeparator()}
              {renderLeafItem(item, index)}
            </View>
          )
        })}
      </View>
    ),
    [renderSeparator, renderLeafItem]
  )

  const renderItem = useCallback(
    (item: DetailItem, index: number): JSX.Element => {
      if (
        typeof item !== 'string' &&
        item.type === DetailItemType.COLLAPSIBLE_GROUP
      ) {
        return (
          <CollapsibleDetailGroup
            label={item.label}
            verticalPadding={VERTICAL_PADDING}
            renderContent={() => item.value.map(renderNestedSection)}
          />
        )
      }

      return renderLeafItem(item, index)
    },
    [renderLeafItem, renderNestedSection]
  )

  const renderTitle = useCallback(
    (): JSX.Element | null =>
      title?.trim() ? (
        <Text
          variant="buttonMedium"
          sx={{
            fontSize: 16,
            lineHeight: 22,
            color: '$textPrimary',
            paddingTop: VERTICAL_PADDING
          }}>
          {title}
        </Text>
      ) : null,
    [title]
  )

  return (
    <View
      sx={{
        backgroundColor: colors.$surfaceSecondary,
        borderRadius: 12,
        paddingHorizontal: 16
      }}>
      <FlatList
        scrollEnabled={false}
        data={detailSection.items}
        renderItem={({ item, index }) => renderItem(item, index)}
        keyExtractor={(_item, index) => index.toString()}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={renderTitle}
      />
    </View>
  )
}

type LeafItem = Exclude<DetailItem, CollapsibleGroupItem>
type RowItem = Exclude<LeafItem, TransferListItem>

const VERTICAL_PADDING = 13
const TRANSFER_ROW_PADDING = 5
