import { Network } from "@avalabs/core-chains-sdk";
import { MarkrQuote, MarkrTransaction, SwapQuoteUpdate } from "../types";
import { fetch as expoFetch } from 'expo/fetch';
import { MARKR_EVM_PARTNER_ID } from "../consts";
import { Account } from "store/account";
import { Zodios } from "@zodios/core";
import { z } from "zod";

/**
 * Expo fetch is used to fetch the swap rate stream from the Markr orchestrator 
 * since react native fetch, or axios, does not support streaming.
 * The stream is a continuous stream of data, so we need to process it in chunks.
 * The data is sent in the following format:
 * 
 * data:{
 *  "uuid":"1234567890",
 *  "aggregator":{"id":"odos","name":"Odos"},
 *  "tokenIn":"0x0000000000000000000000000000000000000000",
 *  "tokenInDecimals":18,
 *  "amountIn":"1000000000000000000",
 *  "tokenOut":"0x0000000000000000000000000000000000000000",
 *  "tokenOutDecimals":18,
 *  "amountOut":"1000000000000000000",
 *  "done":false
 * }
 * 
 * done: true means the quote is done and we need to stop the stream.
 * 
 * NOTE: Markr Team is going to publish their own SDK for the orchestrator,
 * so we will be able to use it directly in the future.
 */

const ORCHESTRATOR_URL = 'https://orchestrator.markr.io';
const DATA_PREFIX = 'data:';
const NEWLINE = '\n';

// Utility functions - pure functions that don't depend on instance state
const parseReceivedData = (data: string): MarkrQuote => {
    try {
        return JSON.parse(data.slice(DATA_PREFIX.length).trim());
    } catch (error) {
        throw new Error('Invalid quote data received');
    }
};

const isBetterQuote = (current: MarkrQuote, best: MarkrQuote | null): boolean => {
    if (!best) return true;
    if (!current.amountOut) return false;
    return BigInt(current.amountOut) > BigInt(best.amountOut ?? '0') || !!current.done;
};

const processEvent = (eventBuffer: string, best: MarkrQuote | null, allQuotes: MarkrQuote[],
    onUpdate: (update: SwapQuoteUpdate) => void): { best: MarkrQuote | null; allQuotes: MarkrQuote[] } => {
    if (!eventBuffer.startsWith(DATA_PREFIX)) return { best, allQuotes };

    const data = parseReceivedData(eventBuffer);
    if (data.done) return { best, allQuotes };

    // Add the new quote to all quotes array
    const newAllQuotes = [...allQuotes, data];

    if (isBetterQuote(data, best)) {
        onUpdate({ allQuotes: newAllQuotes, bestQuote: data });
        return { best: data, allQuotes: newAllQuotes };
    } else {
        // Still update with all quotes even if it's not the best
        onUpdate({ allQuotes: newAllQuotes, bestQuote: best! });
        return { best, allQuotes: newAllQuotes };
    }
};

const processStreamChunk = (
    buffer: string,
    eventBuffer: string,
    best: MarkrQuote | null,
    allQuotes: MarkrQuote[],
    onUpdate: (update: SwapQuoteUpdate) => void
): { newBuffer: string; newEvent: string; newBest: MarkrQuote | null; newAllQuotes: MarkrQuote[] } => {
    const nl = buffer.indexOf(NEWLINE);
    if (nl === -1) return { newBuffer: buffer, newEvent: eventBuffer, newBest: best, newAllQuotes: allQuotes };

    const line = buffer.slice(0, nl);
    const newBuffer = buffer.slice(nl + 1);

    if (line === '') {
        const result = processEvent(eventBuffer, best, allQuotes, onUpdate);
        return { newBuffer, newEvent: '', newBest: result.best, newAllQuotes: result.allQuotes };
    }

    return { newBuffer, newEvent: eventBuffer + line, newBest: best, newAllQuotes: allQuotes };
};

interface GetSwapRateStreamParams {
    fromTokenAddress: string,
    fromTokenDecimals: number,
    toTokenAddress: string,
    toTokenDecimals: number,
    amount: string,
    network: Network,
    account: Account,
    slippage: number,
    onUpdate: (update: SwapQuoteUpdate) => void,
    abortSignal: AbortSignal
}

const GetSwapTransactionBodySchema = z.object({
    uuid: z.string(),
    chainId: z.number(),
    from: z.string(),
    tokenIn: z.string(),
    tokenOut: z.string(),
    amountIn: z.string(),
    minAmountOut: z.string(),
    appId: z.string()
});

const GetSwapTransactionResponseSchema = z.object({
    to: z.string(),
    data: z.string(),
    value: z.string()
});

const markrServiceClient = new Zodios(
    ORCHESTRATOR_URL,
    [
        {
            method: 'post',
            path: '/swap',
            alias: 'swap',
            parameters: [
                {
                  name: 'body',
                  type: 'Body',
                  schema: GetSwapTransactionBodySchema
                }
            ],
            response: GetSwapTransactionResponseSchema
        }
    ],
    {
        axiosConfig: {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }
)

class MarkrService {

    async getSwapRateStream({
        fromTokenAddress,
        fromTokenDecimals,
        toTokenAddress,
        toTokenDecimals,
        amount,
        network,
        account,
        slippage,
        onUpdate,
        abortSignal
    }: GetSwapRateStreamParams) {
        try {
            const response = await expoFetch(`${ORCHESTRATOR_URL}/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appId: MARKR_EVM_PARTNER_ID,
                    chainId: network.chainId,
                    from: account.addressC,
                    tokenIn: fromTokenAddress,
                    tokenInDecimals: fromTokenDecimals,
                    tokenOut: toTokenAddress,
                    tokenOutDecimals: toTokenDecimals,
                    amount,
                    slippage
                }),
                signal: abortSignal
            });

            if (!response.body) {
                throw new Error('ReadableStream unavailable');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let buffer = '';
            let eventBuffer = '';
            let best: MarkrQuote | null = null;
            let allQuotes: MarkrQuote[] = [];

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                while (buffer.includes(NEWLINE)) {
                    const result = processStreamChunk(buffer, eventBuffer, best, allQuotes, onUpdate);
                    buffer = result.newBuffer;
                    eventBuffer = result.newEvent;
                    best = result.newBest;
                    allQuotes = result.newAllQuotes;
                }
            }

            return best ?? { done: true };
        } catch (error) {
            if (error instanceof Error && error.message.includes('FetchRequestCanceledException')) {
                throw new Error('Aborted');
            }
            throw error;
        }
    }

    async buildSwapTransaction({
        quote,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        appId,
        network,
        from
    }: {
        quote: MarkrQuote,
        tokenIn: string,
        tokenOut: string,
        amountIn: string,
        minAmountOut: string,
        appId: string,
        network: Network,
        from: string
    }): Promise<MarkrTransaction> {
        const { uuid } = quote
        const response = await markrServiceClient.swap({
            uuid,
            chainId: network.chainId,
            from,
            tokenIn,
            tokenOut,
            amountIn,
            minAmountOut,
            appId
        })
        return response;
    }

}

export default new MarkrService()