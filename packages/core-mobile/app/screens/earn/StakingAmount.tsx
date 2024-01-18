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
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

export default function StakingAmount(): JSX.Element {
  const avaxFormatter = useAvaxFormatter()
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

  const cumulativeBalance = useMemo(
    () => cChainBalanceAvax.add(claimableBalance || 0),
    [cChainBalanceAvax, claimableBalance]
  )
  const amountNotEnough =
    !inputAmount.isZero() && inputAmount.lt(minStakeAmount)

  const notEnoughBalance = inputAmount.gt(cumulativeBalance)

  const inputValid =
    !amountNotEnough && !notEnoughBalance && !inputAmount.isZero()

  const [balanceInAvax] = avaxFormatter(cumulativeBalance, true)

  function handleAmountChange(amount: Avax): void {
    setInputAmount(amount)
  }

  function setAmount(factor: number): void {
    AnalyticsService.capture('StakeUseAmountPercentage', {
      percent: (100 / factor).toString()
    })
    setInputAmount(cumulativeBalance.div(factor))
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
        <Row style={{ justifyContent: 'center' }}>
          <Tooltip
            content="Final staking amount may be slightly lower due to fees"
            style={{ width: 150 }}>
            <AvaText.Subtitle1
              color={theme.neutral500}
              testID="available_balance">
              Balance:
              {' ' + balanceInAvax + ' AVAX'}
            </AvaText.Subtitle1>
          </Tooltip>
        </Row>
      )}
      <Space y={40} />
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
            {`Minimum amount to stake is ${minStakeAmount.toString()} AVAX`}
          </AvaText.Body3>
        )}
        {notEnoughBalance && (
          <AvaText.Body3 color={theme.colorError}>
            {`Insufficient balance`}
          </AvaText.Body3>
        )}
      </View>
      <FlexSpacer />
      {inputValid && (
        <AvaButton.PrimaryLarge
          onPress={() => {
            AnalyticsService.capture('StakeOpenDurationSelect')
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
            balance={cumulativeBalance}
            onPercentageSelected={setAmount}
          />
        </Row>
      )}
    </View>
  )
}
