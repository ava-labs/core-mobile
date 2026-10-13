import { DetailItem, DetailItemType } from '@avalabs/vm-module-types'
import { toSentenceCase } from 'common/utils/toSentenceCase'

export const getDetailItemLabel = (item: Exclude<DetailItem, string>): string =>
  item.type === DetailItemType.CURRENCY && item.isAssetLabel
    ? item.label
    : toSentenceCase(item.label)
