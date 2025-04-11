import { IndexPath } from '@avalabs/k2-alpine'
import { DropdownSelection } from 'common/types'
import { advancedFilterDropDownItems } from 'consts/earn'
import { useState, useMemo } from 'react'

export const useNodeSort = (): DropdownSelection => {
  const [selectedIndexPath, setSelectedIndexPath] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const data = useMemo(
    () => [advancedFilterDropDownItems.map(item => item.key)],
    []
  )

  return {
    title: 'Sort',
    data,
    selected: selectedIndexPath,
    onSelected: setSelectedIndexPath
  }
}
