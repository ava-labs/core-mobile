import React, { FC, ReactNode, useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import {
  Blockchain,
  BridgeTransaction,
  getNativeSymbol,
  usePrice,
  usePriceForChain
} from '@avalabs/bridge-sdk'
import DotSVG from 'components/svg/DotSVG'
import Avatar from 'components/Avatar'
import AvaListItem from 'components/AvaListItem'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import Separator from 'components/Separator'
import BridgeConfirmations from 'screens/bridge/components/BridgeConfirmations'
import { useBridgeContext } from 'contexts/BridgeContext'
import { StackNavigationOptions } from '@react-navigation/stack'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useNavigation } from '@react-navigation/native'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectTokenInfo } from 'store/network'
import { blockchainDisplayNameMap } from 'screens/bridge/utils/bridgeUtils'

type Props = {
  txHash: string
  setNavOptions: (options: StackNavigationOptions) => void
  HeaderRight?: ReactNode
}

const BridgeTransactionStatus: FC<Props> = ({
  txHash,
  setNavOptions,
  HeaderRight = null
}) => {
  const { bridgeTransactions, removeBridgeTransaction } = useBridgeContext()
  const bridgeTransaction = bridgeTransactions[txHash] as
    | BridgeTransaction
    | undefined

  const tokenInfo = useSelector(
    selectTokenInfo(bridgeTransaction?.symbol ?? '')
  )
  Logger.info(
    `updated tx: ${bridgeTransaction?.sourceTxHash} count: ${
      bridgeTransaction?.confirmationCount
    } completed: ${bridgeTransaction?.complete} completedAt: ${
      bridgeTransaction?.completedAt
    } logStamp: ${Date.now()}`
  )
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency, currencyFormatter } = appHook
  const navigation = useNavigation()

  const assetPrice = usePrice(
    bridgeTransaction?.symbol,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const networkPrice = usePriceForChain(bridgeTransaction?.sourceChain)

  const formattedNetworkPrice =
    networkPrice && bridgeTransaction?.sourceNetworkFee
      ? currencyFormatter(
          networkPrice.mul(bridgeTransaction.sourceNetworkFee).toNumber()
        )
      : '-'

  useLayoutEffect(() => {
    if (bridgeTransaction) {
      setNavOptions({
        title: `Transaction ${
          bridgeTransaction.complete ? 'Details' : 'Status'
        }`,
        headerRight: () => HeaderRight
      })

      if (bridgeTransaction.complete) {
        removeBridgeTransaction(bridgeTransaction.sourceTxHash)
        if (HeaderRight) {
          navigation.getParent()?.goBack()
        } else {
          navigation.goBack()
        }
      }
    }
  }, [bridgeTransaction?.complete])

  const tokenLogo = (
    <View style={styles.logoContainer}>
      <View style={{ position: 'absolute' }}>
        <DotSVG fillColor={theme.colorBg1} size={72} />
      </View>
      <Avatar.Custom
        name={tokenInfo?.symbol ?? ''}
        logoUri={tokenInfo?.logoUri}
        size={55}
      />
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.infoContainer, { backgroundColor: theme.colorBg2 }]}>
        {tokenLogo}
        {bridgeTransaction && (
          <View>
            <AvaListItem.Base
              title={<AvaText.Body2>Sending amount</AvaText.Body2>}
              titleAlignment={'flex-start'}
              rightComponentHorizontalAlignment={'flex-end'}
              rightComponent={
                <View style={{ alignItems: 'flex-end' }}>
                  <Row>
                    <AvaText.Heading3>
                      {bridgeTransaction?.amount?.toNumber()}
                    </AvaText.Heading3>
                    <AvaText.Heading3 color={theme.colorText3}>
                      {bridgeTransaction?.symbol}
                    </AvaText.Heading3>
                  </Row>
                  <AvaText.Body3 currency color={theme.colorText1}>
                    {assetPrice.mul(bridgeTransaction?.amount ?? 0).toNumber()}
                  </AvaText.Body3>
                </View>
              }
            />
          </View>
        )}
      </View>
      <Space y={16} />
      <View style={[styles.fromContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={<AvaText.Body2>From</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={
            <AvaText.Heading3>
              {blockchainDisplayNameMap.get(
                bridgeTransaction?.sourceChain ?? Blockchain.UNKNOWN
              )}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        <AvaListItem.Base
          title={<AvaText.Body2>Network Fee</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={
            <View style={{ alignItems: 'flex-end' }}>
              <Row>
                <AvaText.Heading3>
                  {bridgeTransaction?.sourceNetworkFee?.toNumber().toFixed(6)}{' '}
                  {getNativeSymbol(
                    bridgeTransaction?.sourceChain ?? Blockchain.UNKNOWN
                  )}
                </AvaText.Heading3>
              </Row>
              <AvaText.Body3 currency color={theme.colorText1}>
                ~{formattedNetworkPrice} {selectedCurrency}
              </AvaText.Body3>
            </View>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={true}
            requiredConfirmationCount={
              bridgeTransaction.requiredConfirmationCount
            }
            complete={bridgeTransaction.complete}
            startTime={bridgeTransaction.sourceStartedAt}
            endTime={bridgeTransaction.targetStartedAt}
            confirmationCount={bridgeTransaction.confirmationCount}
          />
        )}
      </View>
      <Space y={16} />
      <View style={[styles.toContainer, { backgroundColor: theme.colorBg2 }]}>
        <AvaListItem.Base
          title={<AvaText.Body2>To</AvaText.Body2>}
          titleAlignment="flex-start"
          rightComponent={
            <AvaText.Heading3>
              {blockchainDisplayNameMap.get(
                bridgeTransaction?.targetChain ?? Blockchain.UNKNOWN
              )}
            </AvaText.Heading3>
          }
        />
        <Separator color={theme.colorBg3} inset={16} />
        {bridgeTransaction && (
          <BridgeConfirmations
            started={!!bridgeTransaction.targetStartedAt}
            startTime={bridgeTransaction.targetStartedAt}
            endTime={bridgeTransaction.completedAt}
            requiredConfirmationCount={
              1 // On avalanche, we just need 1 confirmation
            }
            complete={bridgeTransaction.complete}
            confirmationCount={bridgeTransaction.complete ? 1 : 0}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 100,
    zIndex: 1000
  },
  infoContainer: {
    marginTop: 30,
    paddingTop: 30,
    marginHorizontal: 16,
    borderRadius: 10
  },
  fromContainer: {
    minHeight: 200,
    marginHorizontal: 16,
    paddingBottom: 16,
    borderRadius: 10
  },
  toContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    paddingBottom: 16
  }
})

export default BridgeTransactionStatus
