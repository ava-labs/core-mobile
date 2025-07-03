import { swapError } from "errors/swapError"
import {
    MARKR_EVM_NATIVE_TOKEN_ADDRESS,
    MARKR_EVM_PARTNER_ID
} from "../consts"
import MarkrService from "../services/MarkrService"
import {
    EvmSwapQuote,
    GetQuoteParams,
    isMarkrQuote,
    MarkrTransaction,
    PerformSwapParams,
    SwapProvider
} from "../types"
import { resolve } from "@avalabs/core-utils-sdk/dist"
import { TransactionParams } from "@avalabs/evm-module"
import { bigIntToHex } from "@ethereumjs/util"
import { ERC20__factory } from "contracts/openzeppelin"
import Big from "big.js"
import { RequestContext } from "store/rpc/types"

export const MarkrProvider: SwapProvider = {

    async getQuote({
        isFromTokenNative,
        fromTokenAddress,
        fromTokenDecimals,
        isToTokenNative,
        toTokenAddress,
        toTokenDecimals,
        amount,
        network,
        account,
        slippage,
        onUpdate,
    }: GetQuoteParams, abortSignal: AbortSignal): Promise<EvmSwapQuote> {
        if (!fromTokenAddress || !fromTokenDecimals) {
            throw new Error('No source token selected')
        }

        if (!toTokenAddress || !toTokenDecimals) {
            throw new Error('No destination token selected')
        }

        if (!amount) {
            throw new Error('No amount')
        }

        if (!onUpdate) {
            throw new Error('onUpdate is required when swap use markr is enabled')
        }

        const response = await MarkrService.getSwapRateStream({
            fromTokenAddress: isFromTokenNative ? MARKR_EVM_NATIVE_TOKEN_ADDRESS : fromTokenAddress,
            toTokenAddress: isToTokenNative ? MARKR_EVM_NATIVE_TOKEN_ADDRESS : toTokenAddress,
            fromTokenDecimals,
            toTokenDecimals,
            amount: amount.toString(),
            network,
            account,
            slippage,
            onUpdate,
            abortSignal
        })

        if ('done' in response) {
            throw new Error('No rate found')
        }

        return response
    },

    async swap({
        srcTokenAddress,
        isSrcTokenNative,
        destTokenAddress,
        isDestTokenNative,
        quote,
        slippage,
        network,
        provider,
        userAddress,
        signAndSend
    }: PerformSwapParams) {
        if (!srcTokenAddress) throw swapError.missingParam('srcTokenAddress')

        if (!destTokenAddress) throw swapError.missingParam('destTokenAddress')

        if (!quote) throw swapError.missingParam('quote')

        if (!isMarkrQuote(quote)) {
            throw swapError.wrongQuoteProvider("markr")
        }

        const { amountIn, amountOut } = quote

        if (!amountIn || !amountOut) throw swapError.missingParam('quote')

        if (!userAddress) throw swapError.missingParam('userAddress')

        if (!network) throw swapError.missingParam('activeNetwork')

        if (network.isTestnet)
            throw swapError.networkNotSupported(network.chainName)

        const slippagePercent = slippage / 100
        // const feePercent = isSwapFeesEnabled ? MARKR_PARTNER_FEE_BPS / 10_000 : 0
        const totalPercent = slippagePercent

        const minAmount = new Big(amountOut)
            .times(1 - totalPercent)
            .toFixed(0)

        const sourceAmount = amountIn
        const destinationAmount = minAmount

        const tx: MarkrTransaction = await MarkrService.buildSwapTransaction({
            quote,
            tokenIn: isSrcTokenNative ? MARKR_EVM_NATIVE_TOKEN_ADDRESS : srcTokenAddress,
            tokenOut: isDestTokenNative ? MARKR_EVM_NATIVE_TOKEN_ADDRESS : destTokenAddress,
            amountIn: sourceAmount,
            minAmountOut: destinationAmount,
            appId: MARKR_EVM_PARTNER_ID,
            network,
            from: userAddress
        })

        // no need to approve native token
        if (!isSrcTokenNative) {
            const spenderAddress: string = tx.to

            const contract = ERC20__factory.connect(srcTokenAddress, provider)

            const [allowance, allowanceError] = await resolve<bigint>(
                contract.allowance(userAddress, spenderAddress)
            )

            if (allowance === null || allowanceError) {
                throw swapError.cannotFetchAllowance(allowanceError)
            }

            if (allowance < BigInt(sourceAmount)) {
                const { data } =
                    (await contract.approve?.populateTransaction(
                        spenderAddress,
                        sourceAmount
                    )) ?? {}

                const tx = {
                    from: userAddress,
                    to: srcTokenAddress,
                    data
                }

                const [approveGasLimit, approveGasLimitError] = await resolve(
                    provider.estimateGas(tx)
                )

                if (approveGasLimitError || !approveGasLimit) {
                    throw swapError.approvalTxFailed(approveGasLimitError)
                }

                const gas = bigIntToHex(approveGasLimit)

                const [approvalTxHash, approvalTxError] = await resolve(
                    signAndSend([{ ...tx, gas }], {
                        // we don't want to show confetti for token spend limit approvals
                        [RequestContext.CONFETTI_DISABLED]: true
                    })
                )

                if (!approvalTxHash || approvalTxError) {
                    throw swapError.approvalTxFailed(approvalTxError)
                }

                const receipt = await provider.waitForTransaction(approvalTxHash)

                if (!receipt || (receipt && receipt.status !== 1)) {
                    throw swapError.approvalTxFailed(new Error('Transaction Reverted'))
                }
            }
        }

        const txParams: [TransactionParams] = [
            {
                from: userAddress,
                to: tx.to,
                gas: undefined,
                data: tx.data,
                value: isSrcTokenNative ? bigIntToHex(BigInt(sourceAmount)) : undefined // AVAX value needs to be sent with the transaction
            }
        ]

        const [swapTxHash, swapTxError] = await resolve(signAndSend(txParams))

        if (!swapTxHash || swapTxError) {
            throw swapError.swapTxFailed(swapTxError)
        }

        return swapTxHash
    }
}