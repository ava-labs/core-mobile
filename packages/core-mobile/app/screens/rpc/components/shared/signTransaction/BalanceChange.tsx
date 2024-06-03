import { Text, View, useTheme } from '@avalabs/k2-mobile'
import React, { useCallback, useMemo } from 'react'
import {
  Asset,
  AssetDiff,
  TransactionSimulation
} from 'services/blockaid/types'
import Avatar from 'components/Avatar'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { balanceToDisplayValue, numberToBN } from '@avalabs/utils-sdk'
import {
  AddLiquidityDisplayData,
  ContractCall,
  SwapExactTokensForTokenDisplayValues,
  TransactionDisplayValues,
  isAddLiquidityDisplayData,
  isSwapExactTokensForTokenDisplayValues
} from 'screens/rpc/util/types'
import Separator from 'components/Separator'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import AddSVG from 'components/svg/AddSVG'
import ArrowSVG from 'components/svg/ArrowSVG'
import isEmpty from 'lodash.isempty'
import { useSelector } from 'react-redux'
import { selectTokenByAddress } from 'store/balance'
import { sharedStyles } from './styles'

const BalanceChange = ({
  contractType,
  displayData,
  transactionSimulation
}: {
  contractType?: ContractCall
  displayData: TransactionDisplayValues
  transactionSimulation?: TransactionSimulation
}): JSX.Element | null => {
  const {
    theme: { colors }
  } = useTheme()
  const transactionType = displayData.name || undefined

  const content = useMemo(() => {
    if (
      transactionSimulation &&
      transactionSimulation.account_summary.assets_diffs.length > 0
    ) {
      return (
        <TransactionSimulationResultBalanceChangeContent
          transactionSimulation={transactionSimulation}
        />
      )
    }

    if (
      (contractType === ContractCall.ADD_LIQUIDITY ||
        contractType === ContractCall.ADD_LIQUIDITY_AVAX) &&
      isAddLiquidityDisplayData(displayData) &&
      displayData.poolTokens.length > 0
    ) {
      return <AddLiquidityTransactionBalanceChangeContent data={displayData} />
    }

    if (
      contractType === ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS &&
      isSwapExactTokensForTokenDisplayValues(displayData)
    ) {
      return <SwapTransactionBalanceChangeContent data={displayData} />
    }

    if (
      (contractType === ContractCall.UNKNOWN || contractType === undefined) &&
      !isEmpty(displayData.displayValue)
    ) {
      return <GenericTransactionBalanceChangeContent data={displayData} />
    }
  }, [displayData, transactionSimulation, contractType])

  if (!content) {
    return null
  }

  return (
    <>
      <Text variant="body2">Balance Change</Text>
      <View
        sx={{
          ...sharedStyles.info,
          backgroundColor: '$neutral800',
          gap: 10
        }}>
        {transactionType && (
          <>
            <View
              sx={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption">Transaction type</Text>
              <Text variant="caption">{transactionType}</Text>
            </View>
            <Separator color={colors.$neutral700} />
          </>
        )}
        {content}
      </View>
    </>
  )
}

const TransactionSimulationResultBalanceChangeContent = ({
  transactionSimulation
}: {
  transactionSimulation: TransactionSimulation
}): JSX.Element => {
  const { currencyFormatter } = useApplicationContext().appHook

  const renderAssetDiff = useCallback(
    ({
      asset,
      assetDiff,
      isOut,
      key
    }: {
      asset: Asset
      assetDiff: AssetDiff
      isOut: boolean
      key: string
    }): JSX.Element => {
      let displayValue
      if ('value' in assetDiff && assetDiff.value && 'decimals' in asset) {
        const valueBN = numberToBN(assetDiff.value, asset.decimals)
        displayValue = balanceToDisplayValue(valueBN, asset.decimals)
      } else if (asset.type === 'ERC721' || asset.type === 'ERC1155') {
        // for NFTs, blockaid doesn't provide the actual value of the NFTs transferred
        // so we just display 1 to indicate that a single NFT will be transferred
        displayValue = 1
      }

      const assetDiffColor = isOut ? '$dangerLight' : '$successLight'

      return (
        <View
          key={key}
          sx={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              flexShrink: 1
            }}>
            {asset.name !== undefined && asset.symbol !== undefined && (
              <Avatar.Token
                name={asset.name}
                symbol={asset.symbol}
                logoUri={asset.logo_url}
                size={32}
              />
            )}
            <Text variant="heading6" numberOfLines={1} sx={{ flexShrink: 1 }}>
              {asset.name}
            </Text>
          </View>
          <View sx={{ alignItems: 'flex-end' }}>
            {displayValue !== undefined && (
              <Text variant="body2" sx={{ color: assetDiffColor }}>
                {isOut ? '-' : ''}
                {displayValue} {asset.symbol}
              </Text>
            )}
            {assetDiff.usd_price !== undefined && (
              <Text
                variant="body2"
                sx={{
                  color:
                    displayValue !== undefined ? '$neutral400' : assetDiffColor
                }}>
                {displayValue === undefined && (isOut ? '-' : '')}
                {currencyFormatter(Number(assetDiff.usd_price))}
              </Text>
            )}
          </View>
        </View>
      )
    },
    [currencyFormatter]
  )

  return (
    <>
      {transactionSimulation.account_summary.assets_diffs.map(
        (assetDiff, index) => {
          const asset = assetDiff.asset

          return (
            <View key={index.toString()} sx={{ gap: 16 }}>
              {assetDiff.out.map((outAssetDiff, i) =>
                renderAssetDiff({
                  asset,
                  assetDiff: outAssetDiff,
                  isOut: true,
                  key: i.toString()
                })
              )}
              {assetDiff.in.map((inAssetDiff, i) =>
                renderAssetDiff({
                  asset,
                  assetDiff: inAssetDiff,
                  isOut: false,
                  key: i.toString()
                })
              )}
            </View>
          )
        }
      )}
    </>
  )
}

const AddLiquidityTransactionBalanceChangeContent = ({
  data
}: {
  data: AddLiquidityDisplayData
}): JSX.Element => {
  const { currencyFormatter } = useApplicationContext().appHook
  const {
    theme: { colors }
  } = useTheme()

  return (
    <>
      {data.poolTokens.map((token, index) => (
        <View key={token.name}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ alignItems: 'center' }}>
              <Avatar.Custom name={token.name} symbol={token.symbol} />
              <Space x={16} />
              <Text variant="body1">{token.symbol}</Text>
            </Row>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="body1">
                {token.amountDepositedDisplayValue} {token.symbol}
              </Text>
              {isNaN(Number(token.amountCurrencyValue)) ? null : (
                <Text variant="caption">
                  {currencyFormatter(Number(token.amountCurrencyValue))}
                </Text>
              )}
            </View>
            {index < data.poolTokens.length - 1 && (
              <Row
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginStart: 8
                }}>
                <AddSVG color={colors.$white} size={16} />
              </Row>
            )}
          </Row>
        </View>
      ))}
    </>
  )
}

const SwapTransactionBalanceChangeContent = ({
  data
}: {
  data: SwapExactTokensForTokenDisplayValues
}): JSX.Element => {
  const { currencyFormatter } = useApplicationContext().appHook
  const {
    theme: { colors }
  } = useTheme()

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sentToken = data.path[0]!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const receivingToken = data.path[data.path.length - 1]!

  return (
    <>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ alignItems: 'center' }}>
          <Avatar.Token
            name={sentToken.name}
            symbol={sentToken.symbol}
            logoUri={sentToken.logoUri}
          />
          <Space x={8} />
          <Text variant="body1">{sentToken?.symbol}</Text>
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="body2">
            {sentToken.amountIn?.value} {sentToken?.symbol}
          </Text>
          <Text variant="caption">
            {currencyFormatter(Number(sentToken?.amountCurrencyValue))}
          </Text>
        </View>
      </Row>
      <Row style={sharedStyles.arrow}>
        <ArrowSVG size={11} color={colors.$white} rotate={-45} />
      </Row>
      <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Row style={{ alignItems: 'center' }}>
          <Avatar.Token
            name={receivingToken.name}
            symbol={receivingToken.symbol}
            logoUri={receivingToken.logoUri}
          />
          <Space x={8} />
          <Text variant="body1">{receivingToken?.symbol}</Text>
        </Row>
        <View style={{ alignItems: 'flex-end' }}>
          <Text variant="body2">
            {receivingToken.amountOut?.value} {receivingToken?.symbol}
          </Text>
          <Text variant="caption">
            {currencyFormatter(Number(receivingToken?.amountCurrencyValue))}
          </Text>
        </View>
      </Row>
    </>
  )
}

const GenericTransactionBalanceChangeContent = ({
  data
}: {
  data: TransactionDisplayValues
}): JSX.Element => {
  const token = useSelector(selectTokenByAddress(data.description?.args?.asset))

  return (
    <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Row style={{ alignItems: 'center' }}>
        {token ? (
          <Avatar.Token
            name={token.name}
            symbol={token.symbol}
            logoUri={token.logoUri}
          />
        ) : (
          <Avatar.Custom name={'avax'} symbol={'AVAX'} />
        )}
        <Space x={8} />
        <Text variant="body1">{token ? token?.symbol : 'AVAX'}</Text>
      </Row>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="body2">
          {data.displayValue} {token?.symbol}
        </Text>
      </View>
    </Row>
  )
}

export default BalanceChange
