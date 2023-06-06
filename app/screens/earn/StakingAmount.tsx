import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import BN from 'bn.js'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { balanceToDisplayValue, bnToLocaleString } from '@avalabs/utils-sdk'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import PercentButtons from 'screens/earn/PercentButtons'
import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import useStakingParams from 'hooks/useStakingParams'

export default function StakingAmount() {
  const { theme } = useApplicationContext()
  const { minStakeAmount, nativeTokenBalance } = useStakingParams()

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = useSelector(selectNetwork(chainId))
  const nativeTokenDecimals = avaxNetwork?.networkToken.decimals ?? 0
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const [inputAmountBN, setInputAmountBN] = useState(new BN(0))
  const stakeInCurrency = useMemo(
    () =>
      Number.parseFloat(bnToLocaleString(inputAmountBN, nativeTokenDecimals)) *
      nativeTokenPrice,
    [nativeTokenPrice, inputAmountBN, nativeTokenDecimals]
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

  const amountNotEnough =
    !inputAmountBN.isZero() && inputAmountBN.lt(minStakeAmount)

  const notEnoughBalance =
    nativeTokenBalance && inputAmountBN.gt(nativeTokenBalance)

  const inputValid =
    !amountNotEnough && !notEnoughBalance && !inputAmountBN.isZero()

  function handleAmountChange(value: { bn: BN; amount: string }) {
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
      <EarnInputAmount
        handleAmountChange={handleAmountChange}
        inputAmountBN={inputAmountBN}
        decimals={nativeTokenDecimals}
      />
      <Row style={{ justifyContent: 'center' }}>
        <AvaText.Caption currency textStyle={{ color: theme.white }}>
          {stakeInCurrency}
        </AvaText.Caption>
        <AvaText.Caption textStyle={{ color: theme.white }}>
          {` ${selectedCurrency}`}
        </AvaText.Caption>
      </Row>
      <View
        style={{
          marginTop: 16,
          alignItems: 'center'
        }}>
        {amountNotEnough && (
          <AvaText.Body3 color={theme.colorError}>
            {`Minimum amount to stake is 25 AVAX`}
          </AvaText.Body3>
        )}
        {notEnoughBalance && (
          <AvaText.Body3 color={theme.colorError}>
            {`Insufficient balance!`}
          </AvaText.Body3>
        )}
      </View>
      <FlexSpacer />
      {inputValid && <AvaButton.PrimaryLarge>Next</AvaButton.PrimaryLarge>}
      {inputAmountBN.isZero() && (
        <Row style={{ justifyContent: 'space-between' }}>
          <PercentButtons
            isDeveloperMode={isDeveloperMode}
            balance={nativeTokenBalance}
            onPercentageSelected={setAmount}
          />
        </Row>
      )}
    </View>
  )
}
