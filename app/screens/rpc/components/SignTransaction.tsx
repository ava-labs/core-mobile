import AvaText from 'components/AvaText'
import React, { FC, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import {
  AddLiquidityDisplayData,
  ApproveTransactionData,
  ContractCall,
  SwapExactTokensForTokenDisplayValues,
  Transaction,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { useExplainTransaction } from 'screens/rpc/util/useExplainTransaction'
import { ApproveTransaction } from 'screens/rpc/components/Transactions/ApproveTransaction'
import { AddLiquidityTransaction } from 'screens/rpc/components/Transactions/AddLiquidity'
import { GenericTransaction } from 'screens/rpc/components/Transactions/GenericTransaction'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useApplicationContext } from 'contexts/ApplicationContext'
import EditSpendLimit from 'components/EditSpendLimit'
import CarrotSVG from 'components/svg/CarrotSVG'
import { DappEvent } from 'contexts/DappConnectionContext'
import Logger from 'utils/Logger'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import useInAppBrowser from 'hooks/useInAppBrowser'
import FlexSpacer from 'components/FlexSpacer'
import { Popable } from 'react-native-popable'
import { popableContent } from 'screens/swap/components/SwapTransactionDetails'
import { SwapTransaction } from 'screens/rpc/components/Transactions/SwapTransaction'

interface Props {
  onApprove: (tx: Transaction) => Promise<{ hash?: string; error?: any }>
  onReject: () => void
  dappEvent?: DappEvent
  onClose: () => void
}

const SignTransaction: FC<Props> = ({
  dappEvent,
  onApprove,
  onReject,
  onClose
}) => {
  const { openUrl } = useInAppBrowser()
  const theme = useApplicationContext().theme
  const activeNetwork = useActiveNetwork()
  const [txFailedError, setTxFailedError] = useState<string>()
  const [hash, setHash] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [showData, setShowData] = useState(false)
  const {
    contractType,
    selectedGasFee,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    showCustomSpendLimit,
    setShowCustomSpendLimit,
    transaction,
    ...rest
  } = useExplainTransaction(dappEvent)
  const explorerUrl =
    activeNetwork && hash && getExplorerAddressByNetwork(activeNetwork, hash)
  const displayData: TransactionDisplayValues = { ...rest } as any

  const netFeeInfoMessage = popableContent(
    `Gas limit: ${displayData?.gasLimit} \nGas price: ${displayData?.fee} nAVAX`,
    theme.colorBg3
  )

  if (showData) {
    return (
      <View style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => setShowData(false)}>
            <CarrotSVG direction={'left'} size={23} />
          </AvaButton.Base>
          <Space x={14} />
          <AvaText.Heading1>Transaction Data</AvaText.Heading1>
        </Row>
        <Space y={16} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body1>Hex Data:</AvaText.Body1>
          <AvaText.Body1>
            {getHexStringToBytes(displayData?.txParams?.data)} Bytes
          </AvaText.Body1>
        </Row>
        <View style={{ paddingVertical: 14 }}>
          <AvaText.Body1
            textStyle={{
              padding: 16,
              backgroundColor: theme.colorBg3,
              borderRadius: 15
            }}>
            {displayData?.txParams?.data}
          </AvaText.Body1>
        </View>
      </View>
    )
  }

  if (showCustomSpendLimit) {
    return (
      <EditSpendLimit
        site={displayData?.site}
        spendLimit={customSpendLimit}
        token={displayData?.tokenToBeApproved}
        onClose={() => setShowCustomSpendLimit(!showCustomSpendLimit)}
        setSpendLimit={setSpendLimit}
      />
    )
  }

  async function onHandleApprove() {
    setSubmitting(true)
    transaction &&
      onApprove(transaction)
        .then(result => {
          if (result?.hash) {
            Logger.warn('Transaction call approved with hash')
            setHash(result.hash)
            setSubmitting(false)
          }
        })
        .catch(reason => {
          Logger.warn('Transaction call error', reason)
          setTxFailedError(reason)
          setSubmitting(false)
        })
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: 32,
        paddingHorizontal: 14
      }}>
      <View>
        {!displayData?.gasPrice ? (
          <View>
            <ActivityIndicator size={'large'} />
          </View>
        ) : (
          <>
            {(contractType === ContractCall.APPROVE && (
              <ApproveTransaction
                {...(displayData as ApproveTransactionData)}
                hash={hash}
                error={txFailedError}
                onCustomFeeSet={setCustomFee}
                selectedGasFee={selectedGasFee}
                setShowCustomSpendLimit={setShowCustomSpendLimit}
                setShowData={setShowData}
              />
            )) ||
              ((contractType === ContractCall.ADD_LIQUIDITY ||
                contractType === ContractCall.ADD_LIQUIDITY_AVAX) && (
                <AddLiquidityTransaction
                  {...(displayData as AddLiquidityDisplayData)}
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                />
              )) ||
              (contractType === ContractCall.SWAP_EXACT_TOKENS_FOR_TOKENS && (
                <SwapTransaction
                  {...(displayData as SwapExactTokensForTokenDisplayValues)}
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                />
              )) ||
              ((contractType === ContractCall.UNKNOWN ||
                contractType === undefined) && (
                <GenericTransaction
                  {...(displayData as TransactionDisplayValues)}
                  hash={hash}
                  error={txFailedError}
                  onCustomFeeSet={setCustomFee}
                  selectedGasFee={selectedGasFee}
                />
              ))}
          </>
        )}
      </View>
      {!hash && displayData?.gasPrice && (
        <NetworkFeeSelector
          gasPrice={displayData?.gasPrice}
          limit={displayData?.gasLimit ?? 0}
          onChange={setCustomFee}
          currentModifier={selectedGasFee}
          network={activeNetwork}
          disableGasPriceEditing={!!hash}
        />
      )}
      {hash ? (
        <View style={{ flex: 1 }}>
          <Space y={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Popable
              content={netFeeInfoMessage}
              position={'right'}
              style={{ minWidth: 200 }}
              backgroundColor={theme.colorBg3}>
              <AvaText.Body2 color={theme.white} textStyle={{ lineHeight: 24 }}>
                Network Fee ⓘ
              </AvaText.Body2>
            </Popable>
            <View
              style={{
                alignItems: 'flex-end'
              }}>
              <AvaText.Heading3>{displayData.fee} AVAX</AvaText.Heading3>
              <AvaText.Body3 currency>
                {displayData.feeInCurrency}
              </AvaText.Body3>
            </View>
          </Row>
          <Space y={16} />
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body2 color={theme.colorText1}>
              Transaction hash
            </AvaText.Body2>
            <TokenAddress address={hash} copyIconEnd />
          </Row>
          <FlexSpacer />
          <AvaButton.SecondaryLarge
            style={{ marginBottom: 32 }}
            onPress={() => explorerUrl && openUrl(explorerUrl)}>
            View on Explorer
          </AvaButton.SecondaryLarge>
          <Space y={20} />
          <AvaButton.SecondaryLarge
            style={{ marginBottom: 32 }}
            onPress={onClose}>
            Close
          </AvaButton.SecondaryLarge>
        </View>
      ) : (
        <>
          <FlexSpacer />
          <View
            style={{
              paddingVertical: 16,
              paddingHorizontal: 24
            }}>
            <AvaButton.PrimaryLarge
              onPress={onHandleApprove}
              disabled={!displayData || submitting}>
              Approve
            </AvaButton.PrimaryLarge>
            <Space y={20} />
            <AvaButton.SecondaryLarge onPress={onReject}>
              Reject
            </AvaButton.SecondaryLarge>
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

export default SignTransaction
