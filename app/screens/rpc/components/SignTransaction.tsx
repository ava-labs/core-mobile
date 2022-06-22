import AvaText from 'components/AvaText'
import React, { FC, useEffect } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import Avatar from 'components/Avatar'
import TokenAddress from 'components/TokenAddress'
import {
  ApproveTransactionData,
  ContractCall,
  PeerMetadata,
  RpcTokenReceive,
  RpcTokenSend,
  RpcTxParams,
  SwapExactTokensForTokenDisplayValues,
  TransactionDisplayValues
} from 'screens/rpc/util/types'
import { useExplainTransaction } from 'screens/rpc/util/useExplainTransaction'
import CustomFees from 'components/CustomFees'
import Separator from 'components/Separator'
import BN from 'bn.js'
import { bnToLocaleString, stringToBN } from '@avalabs/utils-sdk'
import AddSVG from 'components/svg/AddSVG'
import ArrowSVG from 'components/svg/ArrowSVG'
import { Limit } from 'components/EditFees'
import Spinner from 'components/Spinner'
import TabViewAva from 'components/TabViewAva'
import { getHexStringToBytes } from 'utils/getHexStringToBytes'

interface Props {
  txParams: RpcTxParams
  peerMeta?: PeerMetadata
  onApprove: (values: TransactionDisplayValues) => void
  onReject: () => void
  loading?: boolean
  hash?: string
}

const SignTransaction: FC<Props> = ({
  txParams,
  peerMeta,
  onApprove,
  onReject,
  loading,
  hash
}) => {
  const {
    setCustomFee,
    showCustomSpendLimit,
    setShowCustomSpendLimit,
    setSpendLimit,
    displaySpendLimit,
    customSpendLimit,
    type,
    selectedGasFee,
    ...rest
  } = useExplainTransaction(txParams)

  const contractType = type !== 'CALL' ? type?.toLowerCase() : rest?.abi?.func

  const displayData: TransactionDisplayValues = { ...rest } as any

  const isApprove = !!(contractType && contractType === ContractCall.APPROVE)
  const isUnknown = !contractType || contractType === 'UNKNOWN'
  const isTransaction = !isApprove && !isUnknown

  return (
    <SafeAreaView
      style={{
        paddingTop: 32,
        flex: 1,
        paddingHorizontal: 14
      }}>
      <View>
        {isUnknown && <View />}
        {isApprove && (
          <RpcApproveTransaction
            {...(displayData as ApproveTransactionData)}
            setShowCustomSpendLimit={setShowCustomSpendLimit}
            displayStendLimit={displaySpendLimit}
            onCustomFeeSet={setCustomFee}
            selectedGasFee={selectedGasFee}
            setSpendLimit={setSpendLimit}
            peerMeta={peerMeta}
          />
        )}
        {isTransaction && (
          <RpcTransaction
            {...(displayData as any)}
            onCustomFeeSet={setCustomFee}
            selectedGasFee={selectedGasFee}
            peerMeta={peerMeta}
          />
        )}
      </View>
      {loading ? (
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
            flex: 0,
            paddingVertical: 16,
            paddingHorizontal: 24
          }}>
          <AvaButton.PrimaryMedium onPress={() => onApprove(displayData)}>
            Approve
          </AvaButton.PrimaryMedium>
          <Space y={20} />
          <AvaButton.SecondaryMedium onPress={onReject}>
            Reject
          </AvaButton.SecondaryMedium>
        </View>
      )}
    </SafeAreaView>
  )
}

function RpcApproveTransaction({
  site,
  token: tokenToBeApproved,
  txParams,
  setShowCustomSpendLimit,
  displaySpendLimit,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  isInfinity,
  selectedGasFee,
  setSpendLimit,
  ...rest
}: ApproveTransactionData): JSX.Element {
  const theme = useApplicationContext().theme

  useEffect(() => {
    if (!displaySpendLimit && rest.tokenAmount) {
      setSpendLimit({ limitType: Limit.CUSTOM, value: rest.tokenAmount })
    }
  }, [displaySpendLimit])

  return (
    <>
      <AvaText.Heading1>Approval Summary</AvaText.Heading1>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Account</AvaText.Body2>
          <TokenAddress address={rest.fromAddress} />
        </Row>
        <Space y={8} />
        {rest.contract && (
          <Row style={{ justifyContent: 'space-between' }}>
            <AvaText.Body1>Contract</AvaText.Body1>
            <TokenAddress address={rest.contract} />
          </Row>
        )}
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body2>Website</AvaText.Body2>
          <AvaText.ButtonMedium>https://app.avaee.com</AvaText.ButtonMedium>
        </Row>
      </View>
      <Row style={{ justifyContent: 'space-between' }}>
        <AvaText.Body2>Spend Limit</AvaText.Body2>
        <AvaButton.Base>
          <AvaText.TextLink>Edit</AvaText.TextLink>
        </AvaButton.Base>
      </Row>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center' }}>
            {!!tokenToBeApproved?.logoURI && (
              <Avatar.Custom
                name={'avax'}
                logoUri={tokenToBeApproved.logoURI}
              />
            )}
            <Space x={8} />
            <AvaText.Body3>AVAX</AvaText.Body3>
          </Row>
          <View style={{ alignItems: 'flex-end' }}>
            <AvaText.Body1>
              {displaySpendLimit} {tokenToBeApproved.symbol}
            </AvaText.Body1>
            <AvaText.Body3>usd amount</AvaText.Body3>
          </View>
        </Row>
      </View>
      <Space y={30} />
      {gasPrice.value !== '' && gasPrice.value !== '0' && (
        <CustomFees
          gasPrice={rest.fees.gasPrice}
          limit={gasLimit?.toString() ?? '0'}
          defaultGasPrice={gasPrice}
          onChange={onCustomFeeSet}
          selectedGasFeeModifier={selectedGasFee}
        />
      )}
    </>
  )
}

function RpcTransaction({
  fromAddress,
  txParams,
  gasPrice,
  gasLimit,
  onCustomFeeSet,
  contract,
  balanceChange,
  abi,
  abiStr,
  selectedGasFee,
  contractType,
  ...rest
}: SwapExactTokensForTokenDisplayValues) {
  const theme = useApplicationContext().theme

  const sentTokens = balanceChange?.sendTokenList
  const receivedTokens = balanceChange?.receiveTokenList

  const dataString = [abiStr, abi?.params?.join(' '), txParams?.data].join(' ')

  return (
    <>
      <AvaText.Heading1>Transaction Summary</AvaText.Heading1>
      <Space y={8} />
      <AvaText.Body2>Approve Swimmer Network Transaction</AvaText.Body2>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Account</AvaText.Body3>
          <AvaText.Body3>Account Name</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Contract</AvaText.Body3>
          <TokenAddress address={contract} />
        </Row>
        <Space y={8} />
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Website</AvaText.Body3>
          <AvaText.Body2>https://app.avaae.com</AvaText.Body2>
        </Row>
      </View>
      <AvaText.Body2>Balance Change</AvaText.Body2>
      <View
        style={[
          {
            backgroundColor: theme.colorBg3,
            marginTop: 8,
            marginBottom: 16,
            borderRadius: 10,
            padding: 16
          }
        ]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <AvaText.Body3>Transaction type</AvaText.Body3>
          <AvaText.Body3>{abi?.func}</AvaText.Body3>
        </Row>
        <Space y={8} />
        <Separator color={theme.colorDisabled} />
        <Space y={12} />
        {!!abi?.fun?.includes('approve') && (
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ alignItems: 'center' }}>
              <Avatar.Custom name={'avax'} symbol={'AVAX'} />
              <Space x={8} />
              <AvaText.Body3>AVAX</AvaText.Body3>
            </Row>
            <View style={{ alignItems: 'flex-end' }}>
              <AvaText.Body1>4,000.2334 AVAX</AvaText.Body1>
              <AvaText.Body3>$0.32 USD</AvaText.Body3>
            </View>
          </Row>
        )}

        {!!sentTokens?.length &&
          sentTokens.map((token: RpcTokenSend, index: number) => {
            const priceBN: BN = new BN(token.price)
            const amountBN = stringToBN(token.amount, token.decimals)
            const amountUSD = bnToLocaleString(
              priceBN.mul(amountBN),
              token.decimals
            )
            return (
              <View key={token.name}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Avatar.Custom name={token.name} symbol={token.symbol} />
                    <Space x={16} />
                    <AvaText.Body1>{token.symbol}</AvaText.Body1>
                  </Row>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AvaText.Body1>
                      {token.amount} {token.symbol}
                    </AvaText.Body1>
                    {isNaN(Number(amountUSD)) ? null : (
                      <AvaText.Body3 color={'white'} currency>
                        {amountUSD}
                      </AvaText.Body3>
                    )}
                  </View>
                  {index < sentTokens.length - 1 && (
                    <Row
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginStart: 8
                      }}>
                      <AddSVG color={theme.colorIcon1} size={16} />
                    </Row>
                  )}
                </Row>
              </View>
            )
          })}
        {/* arrow */}
        {!!(sentTokens.length && receivedTokens.length) && (
          <Row
            style={{
              width: '100%',
              marginStart: 8,
              paddingVertical: 10
            }}>
            <ArrowSVG size={16} color={theme.colorIcon1} rotate={0} />
          </Row>
        )}
        {!!receivedTokens?.length &&
          receivedTokens.map((token: RpcTokenReceive, index: number) => {
            const priceBN: BN = new BN(token.price)
            const amountBN = stringToBN(token.amount, token.decimals)
            const amountUSD = bnToLocaleString(
              priceBN.mul(amountBN),
              token.decimals
            )
            return (
              <View key={token.name}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Avatar.Custom name={token.name} logoUri={token.logoURI} />
                    <Space x={16} />
                    <AvaText.Body1>{token.symbol}</AvaText.Body1>
                  </Row>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AvaText.Body1>
                      {token.amount} {token.symbol}
                    </AvaText.Body1>
                    {isNaN(Number(amountUSD)) ? null : (
                      <AvaText.Body3 color={'white'} currency>
                        {amountUSD}
                      </AvaText.Body3>
                    )}
                  </View>
                  {index < sentTokens.length - 1 && (
                    <Row
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        marginStart: 8
                      }}>
                      <AddSVG color={theme.colorIcon1} size={16} />
                    </Row>
                  )}
                </Row>
              </View>
            )
          })}
      </View>
      <Space y={16} />
      <TabViewAva>
        <TabViewAva.Item title={'Feeds'}>
          {gasPrice.value !== '' && gasPrice.value !== '0' && (
            <CustomFees
              gasPrice={rest.fees.gasPrice}
              limit={gasLimit?.toString() ?? '0'}
              defaultGasPrice={gasPrice}
              onChange={onCustomFeeSet}
              selectedGasFeeModifier={selectedGasFee}
            />
          )}
        </TabViewAva.Item>
        <TabViewAva.Item title={'Data'}>
          <>
            <Row style={{ justifyContent: 'space-between' }}>
              <AvaText.Body1>Hex Data:</AvaText.Body1>
              <AvaText.Body1>
                {getHexStringToBytes(txParams?.data)} Bytes
              </AvaText.Body1>
            </Row>
            <View style={{ flex: 1, paddingVertical: 14 }}>
              <AvaText.Body3
                textStyle={{
                  padding: 16,
                  backgroundColor: theme.colorBg3,
                  borderRadius: 15
                }}>
                {dataString}
              </AvaText.Body3>
            </View>
          </>
        </TabViewAva.Item>
      </TabViewAva>
    </>
  )
}

export default SignTransaction
