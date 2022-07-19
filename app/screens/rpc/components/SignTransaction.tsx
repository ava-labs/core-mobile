import AvaText from 'components/AvaText'
import React, { FC, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import {
  AddLiquidityDisplayData,
  ApproveTransactionData,
  ContractCall,
  PeerMetadata,
  TransactionDisplayValues,
  TransactionParams
} from 'screens/rpc/util/types'
import { useExplainTransaction } from 'screens/rpc/util/useExplainTransaction'
import Spinner from 'components/Spinner'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { ApproveTransaction } from 'screens/rpc/components/Transactions/ApproveTransaction'
import { AddLiquidityTx } from 'screens/rpc/components/Transactions/AddLiquidity'
import { GenericTransaction } from 'screens/rpc/components/Transactions/GenericTransaction'
import NetworkFeeSelector from 'components/NetworkFeeSelector'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useApplicationContext } from 'contexts/ApplicationContext'
import EditSpendLimit from 'components/EditSpendLimit'
import CarrotSVG from 'components/svg/CarrotSVG'

interface Props {
  rpcRequest: JsonRpcRequest<TransactionParams[]>
  peerMeta?: PeerMetadata
  onApprove: (values: TransactionDisplayValues) => void
  onReject: () => void
  loading?: boolean
  hash?: string
}

const SignTransaction: FC<Props> = ({
  rpcRequest,
  peerMeta,
  onApprove,
  onReject,
  loading
}) => {
  console.log('got here')
  const {
    contractType,
    selectedGasFee,
    setCustomFee,
    setSpendLimit,
    customSpendLimit,
    hash,
    showCustomSpendLimit,
    setShowCustomSpendLimit,
    ...rest
  } = useExplainTransaction(rpcRequest.params[0], peerMeta)

  const theme = useApplicationContext().theme
  const activeNetwork = useActiveNetwork()
  const [txFailedError, setTxFailedError] = useState<string>()
  const [showData, setShowData] = useState(false)

  const displayData: TransactionDisplayValues = { ...rest } as any

  if (showData) {
    return (
      <View style={{ padding: 16 }}>
        <Row style={{ alignItems: 'center' }}>
          <AvaButton.Base onPress={() => setShowData(false)}>
            <CarrotSVG direction={'left'} size={24} />
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
        onClose={() => setShowCustomSpendLimit(false)}
        setSpendLimit={setSpendLimit}
      />
    )
  }

  return (
    <SafeAreaView
      style={{
        paddingTop: 32,
        flex: 1,
        paddingHorizontal: 14
      }}>
      <View>
        {(contractType === ContractCall.APPROVE && (
          <ApproveTransaction
            {...(displayData as ApproveTransactionData)}
            hash={hash}
            error={txFailedError}
            onCustomFeeSet={setCustomFee}
            selectedGasFee={selectedGasFee}
            setShowCustomSpendLimit={value => setShowCustomSpendLimit(value)}
            setShowData={setShowData}
          />
        )) ||
          ((contractType === ContractCall.ADD_LIQUIDITY ||
            contractType === ContractCall.ADD_LIQUIDITY_AVAX) && (
            <AddLiquidityTx
              {...(displayData as AddLiquidityDisplayData)}
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
      </View>
      {displayData?.gasPrice && (
        <NetworkFeeSelector
          gasPrice={displayData?.gasPrice}
          limit={displayData?.gasLimit ?? 0}
          onChange={setCustomFee}
          currentModifier={selectedGasFee}
          network={activeNetwork}
        />
      )}
      {loading || !displayData ? (
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Spinner size={40} />
        </View>
      ) : hash ? (
        <View>
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body2>Transaction hash</AvaText.Body2>
            <TokenAddress address={hash} copyIconEnd />
          </Row>
        </View>
      ) : (
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 24
          }}>
          <AvaButton.PrimaryLarge onPress={() => onApprove(displayData)}>
            Approve
          </AvaButton.PrimaryLarge>
          <Space y={20} />
          <AvaButton.SecondaryLarge onPress={onReject}>
            Reject
          </AvaButton.SecondaryLarge>
        </View>
      )}
    </SafeAreaView>
  )
}

export default SignTransaction
