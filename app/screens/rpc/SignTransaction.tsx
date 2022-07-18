import AvaText from 'components/AvaText'
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { Row } from 'components/Row'
import Avatar from 'components/Avatar'
import TokenAddress from 'components/TokenAddress'
// @ts-ignore @javascript
import {
  ApproveTransactionData,
  ContractCall,
  RpcTxParams,
  SwapExactTokensForTokenDisplayValues,
  TransactionDisplayValues
} from 'rpc/models'
import { useExplainTransaction } from 'rpc/useExplainTransaction'
import CustomFees from 'components/CustomFees'
import Separator from 'components/Separator'
import BN from 'bn.js'
import { bnToLocaleString, stringToBN } from '@avalabs/utils-sdk'
import AddSVG from 'components/svg/AddSVG'
import ArrowSVG from 'components/svg/ArrowSVG'
import { Limit } from 'components/EditFees'

const SignTransaction = props => {
  const { params } = props.payload
  const peerMeta = props.peerMeta
  const txParams: RpcTxParams = params ? (params[0] as RpcTxParams) : undefined
  const styles = createStyles()

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
  const isTransAction = !isApprove && !isUnknown

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
          />
        )}
        {isTransAction && (
          <>
            <RpcTransaction
              {...(displayData as any)}
              onCustomFeeSet={setCustomFee}
              selectedGasFee={selectedGasFee}
            />
          </>
        )}
      </View>
      <View style={styles.actionContainer}>
        <AvaButton.PrimaryMedium onPress={() => props.onConfirm(displayData)}>
          Approve
        </AvaButton.PrimaryMedium>
        <Space y={20} />
        <AvaButton.SecondaryMedium onPress={() => props.onCancel()}>
          Reject
        </AvaButton.SecondaryMedium>
      </View>
    </SafeAreaView>
  )
}

const renderCustomLabel = (title: string) => {
  return <AvaText.Heading3>{title}</AvaText.Heading3>
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
  const styles = createStyles()
  const theme = useApplicationContext().theme

  console.log('displaySpendLimit:', displaySpendLimit)

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
      {/*<TabViewAva renderCustomLabel={renderCustomLabel}>*/}
      {/*  <TabViewAva.Item title={'Details'}>*/}
      {/*    <View*/}
      {/*      style={[{ backgroundColor: theme.colorBg2, marginVertical: 16 }]}>*/}
      {/*      {gasPrice.value !== '' && gasPrice.value !== '0' && (*/}
      {/*        <CustomFees*/}
      {/*          gasPrice={rest.fees.gasPrice}*/}
      {/*          limit={rest.gasLimit?.toString() ?? '0'}*/}
      {/*          defaultGasPrice={gasPrice}*/}
      {/*          onChange={setCustomFee}*/}
      {/*          selectedGasFeeModifier={selectedGasFee}*/}
      {/*        />*/}
      {/*      )}*/}
      {/*    </View>*/}
      {/*  </TabViewAva.Item>*/}
      {/*  <TabViewAva.Item title={'Data'}>*/}
      {/*    <View style={{ flex: 1, paddingVertical: 16 }}>*/}
      {/*      <AvaText.Body3*/}
      {/*        textStyle={{*/}
      {/*          padding: 16,*/}
      {/*          backgroundColor: theme.colorBg3,*/}
      {/*          borderRadius: 15*/}
      {/*        }}>*/}
      {/*        {displayData?.data}*/}
      {/*      </AvaText.Body3>*/}
      {/*    </View>*/}
      {/*  </TabViewAva.Item>*/}
      {/*</TabViewAva>*/}
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
  const styles = createStyles()
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
          sentTokens.map((token, index) => {
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
                    <Avatar.Token token={token} />
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
          receivedTokens.map((token, index: number) => {
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
                    <Avatar.Token token={token} />
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
      {gasPrice.value !== '' && gasPrice.value !== '0' && (
        <CustomFees
          gasPrice={rest.fees.gasPrice}
          limit={gasLimit?.toString() ?? '0'}
          defaultGasPrice={gasPrice}
          onChange={onCustomFeeSet}
          selectedGasFeeModifier={selectedGasFee}
        />
      )}
      {/*<TabViewAva renderCustomLabel={renderCustomLabel}>*/}
      {/*  <TabViewAva.Item title={'Details'}>*/}
      {/*    <View*/}
      {/*      style={[{ backgroundColor: theme.colorBg3, marginVertical: 16 }]}>*/}
      {/*      <Space y={16} />*/}
      {/*      <CustomFees*/}
      {/*        gasPrice={gasPrice}*/}
      {/*        limit={gasLimit?.toString() ?? '0'}*/}
      {/*        onChange={onCustomFeeSet}*/}
      {/*        selectedGasFeeModifier={selectedGasFee}*/}
      {/*      />*/}
      {/*    </View>*/}
      {/*  </TabViewAva.Item>*/}
      {/*  <TabViewAva.Item title={'Data'}>*/}
      {/*    {abi && (*/}
      {/*      <Row style={{ justifyContent: 'space-between' }}>*/}
      {/*        <AvaText.Body1>Function</AvaText.Body1>*/}
      {/*        <AvaText.Body1>{abi.func}</AvaText.Body1>*/}
      {/*      </Row>*/}
      {/*    )}*/}
      {/*    <Row style={{ justifyContent: 'space-between' }}>*/}
      {/*      <AvaText.Body1>Hex Data:</AvaText.Body1>*/}
      {/*      <AvaText.Body1>*/}
      {/*        {getHexStringToBytes(txParams?.data)} Bytes*/}
      {/*      </AvaText.Body1>*/}
      {/*    </Row>*/}
      {/*    <View style={{ flex: 1, paddingVertical: 14 }}>*/}
      {/*      <AvaText.Body3*/}
      {/*        textStyle={{*/}
      {/*          padding: 16,*/}
      {/*          backgroundColor: theme.colorBg3,*/}
      {/*          borderRadius: 15*/}
      {/*        }}>*/}
      {/*        {dataString}*/}
      {/*      </AvaText.Body3>*/}
      {/*    </View>*/}
      {/*  </TabViewAva.Item>*/}
      {/*</TabViewAva>*/}
    </>
  )
}

const createStyles = () =>
  StyleSheet.create({
    root: {
      paddingTop: 24,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      minHeight: 200,
      paddingBottom: 20
    },
    accountCardWrapper: {
      paddingHorizontal: 24,
      paddingVertical: 8,
      borderRadius: 6,
      backgroundColor: '#C4C4C4'
    },
    intro: {
      textAlign: 'center',
      color: 'black',
      fontSize: 16,
      marginBottom: 8,
      marginTop: 16
    },
    warning: {
      color: 'red',
      paddingHorizontal: 24,
      marginVertical: 16,
      fontSize: 14,
      width: '100%',
      textAlign: 'center'
    },
    actionContainer: {
      flex: 0,
      paddingVertical: 16,
      paddingHorizontal: 24
    },
    button: {
      flex: 1
    },
    cancel: {
      marginRight: 8
    },
    confirm: {
      marginLeft: 8
    },
    domainUrlContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10
    },
    domainUrl: {
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 14,
      color: 'black'
    },
    copyAddressContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginHorizontal: 16
    }
  })

export default SignTransaction
