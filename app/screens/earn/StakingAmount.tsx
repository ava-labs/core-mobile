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
import { Avax } from 'types/Avax'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useEstimateStakingFee } from 'hooks/earn/useEstimateStakingFee'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { ActivityIndicator } from 'components/ActivityIndicator'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

export default function StakingAmount() {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const cChainBalanceAvax = useMemo(
    () => Avax.fromWei(cChainBalance?.data?.balance || 0),
    [cChainBalance?.data?.balance]
  )
  const fetchingBalance = cChainBalance?.data?.balance === undefined
  const claimableBalance = useGetClaimableBalance()

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
  const [inputAmount, setInputAmount] = useState(Avax.fromBase(0))
  const stakeInCurrency = useMemo(
    () => inputAmount.mul(nativeTokenPrice).toFixed(2),
    [inputAmount, nativeTokenPrice]
  )

  const estimatedStakingFee = useEstimateStakingFee(inputAmount)
  const cumulativeBalance = useMemo(
    () => cChainBalanceAvax.add(claimableBalance || 0),
    [cChainBalanceAvax, claimableBalance]
  )
  const availableBalance = useMemo(
    () => cumulativeBalance.sub(estimatedStakingFee || 0),
    [cumulativeBalance, estimatedStakingFee]
  )
  const estimatedStakingFeeForMax = useEstimateStakingFee(cumulativeBalance)

  const amountNotEnough =
    !inputAmount.isZero() && inputAmount.lt(minStakeAmount)

  const notEnoughBalance = inputAmount.gt(availableBalance)

  const inputValid =
    !amountNotEnough && !notEnoughBalance && !inputAmount.isZero()

  function handleAmountChange(amount: Avax) {
    setInputAmount(amount)
  }

  function setAmount(factor: number) {
    if (factor === 1) {
      setInputAmount(availableBalance.sub(estimatedStakingFeeForMax || 0))
    } else {
      setInputAmount(availableBalance.div(factor))
    }
  }

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <AvaText.LargeTitleBold>Staking Amount</AvaText.LargeTitleBold>
      <Space y={7} />
      <AvaText.Subtitle1 color={theme.neutral50}>
        How many AVAX would you like to stake?
      </AvaText.Subtitle1>
      <Space y={40} />
      {fetchingBalance && <ActivityIndicator size="small" />}
      {!fetchingBalance && (
        <>
          <View style={{ alignItems: 'center' }}>
            <AvaText.Subtitle1 color={theme.neutral500}>
              Balance:
              {' ' + cumulativeBalance.toDisplay() + ' AVAX'}
            </AvaText.Subtitle1>
          </View>
        </>
      )}
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
      {!estimatedStakingFee?.isZero() && (
        <>
          <Space y={7} />
          <Row style={{ justifyContent: 'center' }}>
            <AvaText.Caption textStyle={{ color: theme.white }}>
              {`Fee: `}
            </AvaText.Caption>
            <AvaText.Caption textStyle={{ color: theme.white }}>
              {estimatedStakingFee?.toDisplay() + ` AVAX`}
            </AvaText.Caption>
          </Row>
        </>
      )}
      <View
        style={{
          marginTop: 16,
          alignItems: 'center'
        }}>
        {amountNotEnough && (
          <AvaText.Body3 color={theme.colorError}>
            {`Minimum amount to stake is ${minStakeAmount.toString()} AVAX`}
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
      {inputAmount.isZero() && (
        <Row style={{ justifyContent: 'space-between' }}>
          <PercentButtons
            isDeveloperMode={isDeveloperMode}
            balance={cChainBalanceAvax}
            onPercentageSelected={setAmount}
          />
        </Row>
      )}
    </View>
  )
}
