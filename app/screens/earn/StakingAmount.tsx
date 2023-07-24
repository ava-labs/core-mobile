import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
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
import { StakeSetupScreenProps } from 'navigation/types'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { BigIntAvax, BigIntNAvax, BigIntWeiAvax } from 'types/denominations'
import { AmountChange } from 'screens/earn/types'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useWeiAvaxToAvax } from 'hooks/conversion/useWeiAvaxToAvax'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

export default function StakingAmount() {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const weiAvaxToAvax = useWeiAvaxToAvax()
  const nativeTokenBalanceWeiAvax = cChainBalance?.data?.balance
    ? (BigInt(cChainBalance.data.balance) as BigIntWeiAvax)
    : undefined

  const nativeTokenBalanceNavax: BigIntNAvax | undefined =
    nativeTokenBalanceWeiAvax
      ? BigInt(nativeTokenBalanceWeiAvax) / BigInt(1e9)
      : undefined
  const minstakeAmountNavax: BigIntNAvax = minStakeAmount / BigInt(1e9)
  const minStakeAmountAvax: BigIntAvax = minstakeAmountNavax / BigInt(1e9)

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
  const [inputAmount, setInputAmount] = useState<BigIntNAvax>(0n)
  const stakeInCurrency = useMemo(
    () =>
      bigintToBig(inputAmount, nativeTokenDecimals)
        .mul(nativeTokenPrice)
        .toFixed(2),
    [nativeTokenPrice, inputAmount, nativeTokenDecimals]
  )

  const [nativeBalance] = weiAvaxToAvax(
    cChainBalance?.data?.balance,
    nativeTokenPrice
  )

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
          {' ' + nativeBalance + ' AVAX'}
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
            {`Minimum amount to stake is ${minStakeAmountAvax} AVAX`}
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
            navigate(AppNavigation.StakeSetup.StakingDuration, {
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
            balance={nativeTokenBalanceWeiAvax}
            onPercentageSelected={setAmount}
          />
        </Row>
      )}
    </View>
  )
}
