import { Button } from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { SimpleTextInput } from 'common/components/SimpleTextInput'
import React from 'react'

export const SetWalletName = ({
  name,
  setName,
  onNext
}: {
  name: string
  setName: (value: string) => void
  onNext: () => void
}): React.JSX.Element => {
  const renderFooter = (): React.ReactNode => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={onNext}
        disabled={name.length === 0}>
        Next
      </Button>
    )
  }

  return (
    <ScrollViewScreenTemplate
      renderFooter={renderFooter}
      title="How would you like to name your wallet?"
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <SimpleTextInput autoFocus value={name} onChangeText={setName} />
    </ScrollViewScreenTemplate>
  )
}
