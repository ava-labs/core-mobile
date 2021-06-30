import {asyncScheduler, BehaviorSubject, Observable} from 'rxjs'
import {BN, MnemonicWallet, Utils} from "@avalabs/avalanche-wallet-sdk"
import {map, subscribeOn, switchMap} from "rxjs/operators"
import {ChainIdType} from "@avalabs/avalanche-wallet-sdk/dist/types"
import {
  HistoryImportExportTypeName,
  HistoryItemType,
  iHistoryBaseTxTokens
} from "@avalabs/avalanche-wallet-sdk/dist/History/types"
import moment from "moment"
import {iHistoryBaseTxTokensSent} from "@avalabs/avalanche-wallet-sdk/src/History/types"

export class HistoryItem {
  id: string
  amount: string = ""
  date: string = ""
  info: string = ""
  address: string = ""
  explorerUrl: string = ""
  type?: "import" | "export"

  constructor(id: string) {
    this.id = id
  }
}

export default class {
  wallet!: BehaviorSubject<MnemonicWallet>
  history: Observable<HistoryItem[]>

  constructor(wallet: MnemonicWallet) {
    this.wallet = new BehaviorSubject<MnemonicWallet>(wallet)

    const NUM_OF_TRXS = 20
    this.history = this.wallet.pipe(
      subscribeOn(asyncScheduler),
      switchMap(wallet => wallet.getHistory(NUM_OF_TRXS)),
      map(history => this.filterDuplicates(history)),
      map(history => this.mapToHistoryItem(history))
    )
  }

  private mapToHistoryItem(history: HistoryItemType[]): HistoryItem[] {
    return history.map((value: HistoryItemType) => {
        switch (value.type) {
          case "import":
            return this.getImportItem(value)
          case "export":
            return this.getExportItem(value)
          case "transaction":
            return this.getTrxItem(value)
          case "transaction_evm":
            break;
          case "add_delegator":
            break;
          case "add_validator":
            break;
        }
        return this.getBaseItem(value)
      }
    )
  }

  private filterDuplicates(value: HistoryItemType[]): HistoryItemType[] {
    const seenId: string[] = []
    return value.filter((item) => {
      if (seenId.includes(item.id)) {
        return false
      }
      seenId.push(item.id)
      return true
    })
  }

  private getBaseItem(value: HistoryItemType): HistoryItem {
    const historyItem = new HistoryItem(value.id)
    historyItem.explorerUrl = "https://explorer.avax-test.network/tx/" + value.id
    historyItem.date = moment(value.timestamp as Date).format("MMM DD, YYYY")
    historyItem.type = value.type as HistoryImportExportTypeName
    return historyItem
  }

  private getTrxItem(value: HistoryItemType): HistoryItem {
    const historyItem = new HistoryItem(value.id)
    historyItem.explorerUrl = "https://explorer.avax-test.network/tx/" + value.id
    historyItem.date = moment(value.timestamp as Date).format("MMM DD, YYYY")
    if ("tokens" in value) {
      historyItem.info = "Sent"
      let totalSent: BN = new BN(0)

      let sentTokens = (value.tokens as iHistoryBaseTxTokens).sent as iHistoryBaseTxTokensSent
      for (let key in sentTokens) {
        historyItem.address = "to " + sentTokens[key].to[0]
        totalSent = totalSent.add(sentTokens[key].amount)
      }
      if (!totalSent.isZero()) {
        historyItem.type = "export"
        historyItem.amount = "-" + Utils.bnToLocaleString(totalSent, 9)
      } else {
        historyItem.amount = "-"
      }
    }
    return historyItem
  }

  private getImportItem(value: HistoryItemType): HistoryItem {
    const historyItem = new HistoryItem(value.id)
    historyItem.explorerUrl = "https://explorer.avax-test.network/tx/" + value.id
    historyItem.date = moment(value.timestamp as Date).format("MMM DD, YYYY")
    historyItem.type = value.type as HistoryImportExportTypeName
    if ("destination" in value) {
      historyItem.info = "Import (" + (value.destination as ChainIdType) + ")"
    }
    if ("amount" in value) {
      historyItem.amount = Utils.bnToLocaleString(value.amount, 9) + " AVAX"
    }
    return historyItem
  }

  private getExportItem(value: HistoryItemType): HistoryItem {
    const historyItem = new HistoryItem(value.id)
    historyItem.explorerUrl = "https://explorer.avax-test.network/tx/" + value.id
    historyItem.date = moment(value.timestamp as Date).format("MMM DD, YYYY")
    historyItem.type = value.type as HistoryImportExportTypeName
    if ("destination" in value) {
      historyItem.info = "Export (" + (value.source as ChainIdType) + ")"
    }
    if ("amount" in value) {
      historyItem.amount = "-" + Utils.bnToLocaleString(value.amount.add(value.fee), 9) + " AVAX"
    }
    return historyItem
  }
}
