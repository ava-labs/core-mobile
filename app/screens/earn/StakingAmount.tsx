import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import BN from 'bn.js'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { balanceToDisplayValue, stringToBN } from '@avalabs/utils-sdk'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Row } from 'components/Row'
import { BNInput } from 'components/BNInput'
import OvalTagBg from 'components/OvalTagBg'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'

export default function StakingAmount() {
  const { theme } = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const avaxNetwork = useSelector(selectNetwork(ChainId.AVALANCHE_MAINNET_ID))
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const nativeTokenBalance = useSelector(
    selectNativeTokenBalanceForNetworkAndAccount(
      ChainId.AVALANCHE_MAINNET_ID,
      activeAccount?.index
    )
  )
  const { nativeTokenPrice } = useNativeTokenPrice(
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const [inputAmount, setInputAmount] = useState('')
  const [inputAmountBN, setInputAmountBN] = useState(new BN(0))
  const stakeInCurrency = useMemo(
    () => Number.parseFloat(inputAmount) * nativeTokenPrice,
    [nativeTokenPrice, inputAmount]
  )
  const nativeBalance = useMemo(() => {
    if (avaxNetwork && nativeTokenBalance) {
      return (
        balanceToDisplayValue(
          nativeTokenBalance,
          avaxNetwork.networkToken.decimals
        ) + ' AVAX'
      )
    } else {
      return '- AVAX'
    }
  }, [avaxNetwork, nativeTokenBalance])

  function handleAmountChange(value: { bn: BN; amount: string }) {
    setInputAmount(value.amount)
    setInputAmountBN(value.bn)
  }

  function setAmount(factor: number) {
    if (nativeTokenBalance) {
      setInputAmountBN(nativeTokenBalance.div(new BN(factor)))
    }
  }

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Staking Amount</AvaText.LargeTitleBold>
      <Space y={7} />
      <AvaText.Subtitle1 color={theme.neutral50}>
        How much would you like to stake?
      </AvaText.Subtitle1>
      <Space y={40} />
      <View style={{ alignItems: 'center' }}>
        <AvaText.Subtitle1 color={theme.neutral500}>
          Balance:
          {nativeBalance}
        </AvaText.Subtitle1>
      </View>

      <Row
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          width: 250
        }}>
        <BNInput
          value={inputAmountBN}
          denomination={avaxNetwork?.networkToken.decimals ?? 0}
          placeholder={'0.0'}
          onChange={handleAmountChange}
          style={{
            margin: 0
          }}
          textStyle={{
            fontFamily: 'Inter-Bold',
            fontSize: 48,
            lineHeight: 56
          }}
          backgroundColor={theme.transparent}
        />
        <OvalTagBg
          color={theme.neutral900}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4
          }}>
          <Row style={{ alignItems: 'center' }}>
            <AvaLogoSVG
              size={16}
              logoColor={theme.tokenLogoColor}
              backgroundColor={theme.tokenLogoBg}
            />
            <Space x={4} />
            <AvaText.ButtonSmall>AVAX</AvaText.ButtonSmall>
          </Row>
        </OvalTagBg>
      </Row>
      <Row style={{ justifyContent: 'center' }}>
        <AvaText.Caption currency textStyle={{ color: theme.white }}>
          {stakeInCurrency}
        </AvaText.Caption>
        <AvaText.Caption textStyle={{ color: theme.white }}>
          {` ${selectedCurrency}`}
        </AvaText.Caption>
      </Row>
      <FlexSpacer />
      {!inputAmountBN.isZero() && (
        <AvaButton.PrimaryLarge>Next</AvaButton.PrimaryLarge>
      )}
      {inputAmountBN.isZero() && (
        <Row>
          <PercentButtons
            balance={nativeTokenBalance}
            onPercentageSelected={setAmount}
          />
        </Row>
      )}
    </View>
  )
}

const AVAX_DECIMAL = 18
const minStakeAmount = stringToBN('0.7', AVAX_DECIMAL)
const p10 = minStakeAmount.mul(new BN(10))
const p25 = minStakeAmount.mul(new BN(4))
const p50 = minStakeAmount.mul(new BN(2))
const p100 = minStakeAmount

const PercentButtons = ({
  balance,
  onPercentageSelected
}: {
  balance: BN | undefined
  onPercentageSelected: (factor: number) => void
}) => {
  return (
    <>
      {balance?.gt(p10) && (
        <AvaButton.SecondaryLarge
          style={{ flex: 1, marginHorizontal: 4 }}
          onPress={() => onPercentageSelected(10)}>
          10%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p25) && (
        <AvaButton.SecondaryLarge
          style={{ flex: 1, marginHorizontal: 4 }}
          onPress={() => onPercentageSelected(4)}>
          25%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p50) && (
        <AvaButton.SecondaryLarge
          style={{ flex: 1, marginHorizontal: 4 }}
          onPress={() => onPercentageSelected(2)}>
          50%
        </AvaButton.SecondaryLarge>
      )}
      {balance?.gt(p100) && (
        <AvaButton.SecondaryLarge
          style={{ flex: 1, marginHorizontal: 4 }}
          onPress={() => onPercentageSelected(1)}>
          Max
        </AvaButton.SecondaryLarge>
      )}
    </>
  )
}
