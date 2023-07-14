import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import BN from 'bn.js'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import AvaButton from 'components/AvaButton'
import PercentButtons from 'screens/earn/PercentButtons'
import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { useNativeTokenPriceForNetwork } from 'hooks/useNativeTokenPriceForNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { EarnScreenProps } from 'navigation/types'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { BigIntNavax } from 'types/denominations'
import { AmountChange } from 'screens/earn/types'

type EarnScreenNavProps = EarnScreenProps<
  typeof AppNavigation.Earn.StakingAmount
>

export default function StakingAmount() {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<EarnScreenNavProps['navigation']>()
  const { minStakeAmount, nativeTokenBalance } = useStakingParams()
  const nativeTokenBalanceNavax: BigIntNavax | undefined = nativeTokenBalance
    ? BigInt(nativeTokenBalance) / BigInt(1e9)
    : undefined
  const minstakeAmountNavax: BigIntNavax = minStakeAmount / BigInt(1e9)

  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = useSelector(selectNetwork(chainId))
  const nativeTokenDecimals = 9
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const [inputAmount, setInputAmount] = useState<BigIntNavax>(0n)
  const stakeInCurrency = useMemo(
    () =>
      bigintToBig(inputAmount, nativeTokenDecimals)
        .mul(nativeTokenPrice)
        .toFixed(2),
    [nativeTokenPrice, inputAmount, nativeTokenDecimals]
  )
  const nativeBalance = useMemo(() => {
    if (avaxNetwork && nativeTokenBalance) {
      return (
        balanceToDisplayValue(
          new BN(nativeTokenBalance.toString()),
          avaxNetwork.networkToken.decimals
        ) + ' AVAX'
      )
    } else {
      return '- AVAX'
    }
  }, [avaxNetwork, nativeTokenBalance])

  const amountNotEnough =
    inputAmount !== 0n && inputAmount < minstakeAmountNavax

  const notEnoughBalance =
    nativeTokenBalanceNavax && inputAmount > nativeTokenBalanceNavax

  const inputValid = !amountNotEnough && !notEnoughBalance && inputAmount !== 0n

  function handleAmountChange(change: AmountChange) {
    setInputAmount(change.amount)
  }

  function setAmount(factor: number) {
    if (nativeTokenBalanceNavax) {
      setInputAmount(BigInt(nativeTokenBalanceNavax) / BigInt(factor))
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
        inputAmount={inputAmount}
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
      {inputValid && (
        <AvaButton.PrimaryLarge
          onPress={() => {
            navigate(AppNavigation.Earn.StakingDuration, {
              stakingAmount: inputAmount
            })
          }}>
          Next
        </AvaButton.PrimaryLarge>
      )}
      {inputAmount === 0n && (
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
