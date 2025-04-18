import React from 'react'
import { SearchBar, Text, View } from '@avalabs/k2-alpine'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const insets = useSafeAreaInsets()

  const renderHeader = (): React.JSX.Element => {
    return (
      <View sx={{ gap: 8, marginBottom: 16 }}>
        <Text variant="heading2">Select a token</Text>
        <SearchBar onTextChanged={onSearchText} searchText={searchText} />
      </View>
    )
  }

  return (
    <FlashList
      ListHeaderComponent={renderHeader()}
      data={tokens}
      estimatedItemSize={60}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 60,
        paddingHorizontal: 16
      }}
      showsVerticalScrollIndicator={false}
      renderItem={renderListItem}
      keyExtractor={keyExtractor}
    />
  )
}
