import React from 'react'
import { SwapPricingDetailsScreen } from 'features/swap/screens/SwapPricingDetailsScreen'
import {
    useSelectedSwapRate,
    useAllRates,
    useSwapSelectedFromToken,
    useSwapSelectedToToken,
    useBestRate
} from 'features/swap/store'

export default (): JSX.Element => {
    const [fromToken] = useSwapSelectedFromToken()
    const [toToken] = useSwapSelectedToToken()
    const [selectedRate, setSelectedRate] = useSelectedSwapRate()
    const [bestRate] = useBestRate()
    const [allRates] = useAllRates()

    return (
        <SwapPricingDetailsScreen
            fromToken={fromToken}
            toToken={toToken}
            selectedRate={selectedRate}
            setSelectedRate={setSelectedRate}
            bestRate={bestRate}
            allRates={allRates}
        />
    )
}
