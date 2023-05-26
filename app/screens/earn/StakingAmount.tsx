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
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import PercentButtons from 'screens/earn/PercentButtons'
import EarnInputAmount from 'screens/earn/EarnInputAmount'

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
      <EarnInputAmount
        handleAmountChange={handleAmountChange}
        inputAmountBN={inputAmountBN}
        denomination={avaxNetwork?.networkToken.decimals ?? 0}
      />
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
