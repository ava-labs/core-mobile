import { SearchBar } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { FlatListScreenTemplate } from 'common/components/FlatListScreenTemplate'
import React, { useCallback } from 'react'

export const SelectTokenScreen = <T,>({
  tokens,
  searchText,
  onSearchText,
  renderListItem,
  keyExtractor
}: {
  tokens: T[]
  searchText: string
  onSearchText: (value: string) => void
  renderListItem: ListRenderItem<T>
  keyExtractor?: (item: T) => string
}): JSX.Element => {
  const renderHeader = useCallback(() => {
    return <SearchBar onTextChanged={onSearchText} searchText={searchText} />
  }, [onSearchText, searchText])

  return (
    <FlatListScreenTemplate
      title="Select a token"
      data={tokens}
      isModal
      renderItem={renderListItem}
      keyExtractor={keyExtractor}
      renderHeader={renderHeader}
    />
  )
}
