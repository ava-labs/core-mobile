import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useSelector } from 'react-redux'
import { ChainId } from '@avalabs/core-chains-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Row } from 'components/Row'
import FlexSpacer from 'components/FlexSpacer'
import { Button } from '@avalabs/k2-mobile'
import PercentButtons from 'screens/earn/PercentButtons'
import EarnInputAmount from 'screens/earn/EarnInputAmount'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { StakeSetupScreenProps } from 'navigation/types'
import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { Tooltip } from 'components/Tooltip'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { cChainToken } from 'utils/units/knownTokens'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useDelegationContext } from 'contexts/DelegationContext'
import { zeroAvaxPChain } from 'utils/units/zeroValues'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.SmartStakeAmount
>

export default function StakingAmount(): JSX.Element {
  const [isComputing, setIsComputing] = useState<boolean>(false)
  const [computeError, setComputeError] = useState<Error | null>(null)
  const { compute, setStakeAmount, stakeAmount } = useDelegationContext()
  const { getNetwork } = useNetworks()
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const cChainBalanceAvax = useMemo(
    () =>
      cChainBalance?.data?.balance
        ? new TokenUnit(
            cChainBalance?.data?.balance || 0,
            cChainToken.maxDecimals,
            cChainToken.symbol
          )
        : undefined,
    [cChainBalance?.data?.balance]
  )
  const fetchingBalance = cChainBalance?.data?.balance === undefined
  const claimableBalance = useGetClaimableBalance()
  const stuckBalance = useGetStuckBalance()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = getNetwork(chainId)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const stakeInCurrency = useMemo(() => {
    return stakeAmount
      .mul(nativeTokenPrice)
      .toDisplay({ fixedDp: 2, asNumber: true })
  }, [stakeAmount, nativeTokenPrice])

  const cumulativeBalance = useMemo(
    () => cChainBalanceAvax?.add(claimableBalance || 0).add(stuckBalance || 0),
    [cChainBalanceAvax, claimableBalance, stuckBalance]
  )

  const amountNotEnough =
    !stakeAmount.isZero() && stakeAmount.lt(minStakeAmount)

  const notEnoughBalance = cumulativeBalance?.lt(stakeAmount) ?? true

  const inputValid =
    !amountNotEnough && !notEnoughBalance && !stakeAmount.isZero()

  const balanceInAvax = cumulativeBalance?.toDisplay() ?? UNKNOWN_AMOUNT

  function handleAmountChange(amount: TokenUnit): void {
    computeError && setComputeError(null)
    setStakeAmount(amount)
  }

  function setAmount(factor: number): void {
    AnalyticsService.capture('StakeUseAmountPercentage', {
      percent: (100 / factor).toString()
    })
    if (!cumulativeBalance) return

    if (factor === 1) {
      // we can't stake the full amount because of fees
      // to give a good user experience, when user presses max
      // we will stake 99.99% of the balance
      // this is to ensure that the user has enough balance to cover the fees
      setStakeAmount(zeroAvaxPChain().add(cumulativeBalance.mul(0.9999)))
    } else {
      setStakeAmount(zeroAvaxPChain().add(cumulativeBalance.div(factor)))
    }
  }

  const executeCompute = useCallback(async () => {
    setIsComputing(true)
    setComputeError(null)

    try {
      await compute(stakeAmount.toSubUnit())

      AnalyticsService.capture('StakeOpenDurationSelect')
      navigate(AppNavigation.StakeSetup.StakingDuration)
    } catch (e) {
      setComputeError(e as Error)
    }

    setIsComputing(false)
  }, [stakeAmount, compute, navigate])

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
            content={`C-Chain Balance: ${cChainBalanceAvax?.toDisplay()} AVAX\nP-Chain Balance: ${claimableBalance?.toDisplay()} AVAX\nP-Chain Atomic Balance: ${stuckBalance?.toDisplay()} AVAX`}
            style={{ width: 250 }}>
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
        inputAmount={stakeAmount}
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
            {'The specified staking amount exceeds the available balance'}
          </AvaText.Body3>
        )}
        {computeError && (
          <AvaText.Body3 color={theme.colorError}>
            {computeError.message}
          </AvaText.Body3>
        )}
      </View>
      <FlexSpacer />
      {inputValid && (
        <Button
          testID="next_btn"
          type="primary"
          size="xlarge"
          disabled={isComputing}
          onPress={executeCompute}>
          {isComputing ? (
            <>
              <ActivityIndicator /> Computing...
            </>
          ) : (
            'Next'
          )}
        </Button>
      )}
      {stakeAmount.isZero() && (
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
