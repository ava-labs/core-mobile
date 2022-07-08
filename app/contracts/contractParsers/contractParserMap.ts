import { ContractParserHandler } from 'rpc/parseDisplayValues'
import { AddLiquidityParser } from './addLiquidity'
import { AddLiquidityAvaxParser } from './addLiquidityAVAX'
import { ApproveTxParser } from './approve'
import {
  SwapAvaxForExactTokensParser,
  SwapExactAvaxForTokensParser
} from './swapAvaxForExactTokens'
import { SwapExactTokensForAvaxParser } from './swapExactTokensForAVAX'
import {
  SwapExactTokensForTokenParser,
  SwapTokensForExactTokensParser
} from './swapExactTokensForTokens'

export const contractParserMap = new Map<string, ContractParserHandler>([
  SwapExactTokensForTokenParser,
  SwapTokensForExactTokensParser,
  SwapAvaxForExactTokensParser,
  SwapExactAvaxForTokensParser,
  SwapExactTokensForAvaxParser,
  ApproveTxParser,
  AddLiquidityAvaxParser,
  AddLiquidityParser
])
