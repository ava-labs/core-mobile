import React, { useState } from 'react'

import { IndexPath, SimpleDropdown, Button } from '@avalabs/k2-alpine'

export enum AssetsView {
  ManageList = 'Manage list'
}

const sections = [[AssetsView.ManageList]]

export const AssetsManageView = (): React.JSX.Element => {
  const [selectedRow] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const handleOnSelectRow = (): void => {
    // TODO: Implement token manage list
  }

  return (
    <SimpleDropdown
      from={
        <Button type="secondary" size="small">
          View
        </Button>
      }
      offset={10}
      sections={sections}
      selectedRows={[selectedRow]}
      onSelectRow={handleOnSelectRow}
      showSelectedCheckmark={false}
      minWidth={120}
    />
  )
}
