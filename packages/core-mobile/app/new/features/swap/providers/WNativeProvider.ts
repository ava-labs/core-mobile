import { swapError } from "errors/swapError"
import {
    EvmSwapOperation,
    GetQuoteParams,
    isEvmUnwrapQuote,
    isEvmWrapQuote,
    NormalizedSwapQuote,
    NormalizedSwapQuoteResult,
    PerformSwapParams,
    SwapProvider
} from "../types"
import { isWrappableToken } from "../utils/evm/isWrappableToken"
import { unwrap } from "../utils/evm/unwrap"
import { wrap } from "../utils/evm/wrap"

const getWrapOperation = (toTokenAddress: string, amount: bigint): NormalizedSwapQuote => {
    return {
        quote: {
            operation: EvmSwapOperation.WRAP,
            target: toTokenAddress,
            amount: amount.toString(),
        },
        metadata: {
            amountOut: amount.toString()
        }
    }
}

const getUnwrapOperation = (fromTokenAddress: string, amount: bigint): NormalizedSwapQuote => {
    return {
        quote: {
            operation: EvmSwapOperation.UNWRAP,
            source: fromTokenAddress,
            amount: amount.toString(),
        },
        metadata: {
            amountOut: amount.toString()
        }
    }
}

export const WNativeProvider: SwapProvider = {
    name: "wnative",

    async getQuote({
        isFromTokenNative,
        fromTokenAddress,
        toTokenAddress,
        amount,
    }: GetQuoteParams): Promise<NormalizedSwapQuoteResult> {
        let quote: NormalizedSwapQuote;
        if (isFromTokenNative && isWrappableToken(toTokenAddress)) {
            quote = getWrapOperation(toTokenAddress, amount)
        } else {
            quote = getUnwrapOperation(fromTokenAddress, amount)
        }

        return {
            provider: this.name,
            quotes: [quote],
            selected: quote
        }
    },

    async swap({
        quote,
        network,
        provider,
        userAddress,
        signAndSend,
    }: PerformSwapParams) {
        if (!quote) throw swapError.missingParam('quote')

        if (!userAddress) throw swapError.missingParam('userAddress')

        if (isEvmWrapQuote(quote)) {
            return wrap({
                userAddress,
                network,
                provider,
                quote,
                signAndSend
            })
        } else if (isEvmUnwrapQuote(quote)) {
            return unwrap({
                userAddress,
                network,
                provider,
                quote,
                signAndSend
            })
        } else {
            throw swapError.wrongQuoteProvider("wnative")
        }
    }
}