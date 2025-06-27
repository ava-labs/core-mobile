import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account'
import { fetch as expoFetch } from 'expo/fetch';
import { MarkrQuote, SwapQuoteUpdate } from 'features/swap/types'
import { MARKR_EVM_PARTNER_ID } from 'features/swap/consts';

const ORCHESTRATOR_URL = 'https://orchestrator.markr.io';
const DATA_PREFIX = 'data:';
const NEWLINE = '\n';

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

export async function getSwapRateStream({
  fromTokenAddress,
  toTokenAddress,
  fromTokenDecimals,
  toTokenDecimals,
  amount,
  network,
  account,
  slippage,
  onUpdate,
  abortSignal
}: {
  fromTokenAddress?: string,
  toTokenAddress?: string,
  fromTokenDecimals?: number,
  toTokenDecimals?: number,
  amount: string,
  network: Network,
  account: Account,
  slippage: number,
  onUpdate: (update: SwapQuoteUpdate) => void,
  abortSignal?: AbortSignal
}) {
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
