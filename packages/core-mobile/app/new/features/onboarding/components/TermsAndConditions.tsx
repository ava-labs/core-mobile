import React, { useMemo } from 'react'
import { Button, SCREEN_WIDTH, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useTermsOfUse } from 'features/onboarding/hooks/useTermsOfUse'
import { renderRichText } from 'common/utils/renderRichText'
import { Loader } from 'common/components/Loader'

export const TermsAndConditions = ({
  onAgreeAndContinue
}: {
  onAgreeAndContinue: () => void
}): JSX.Element => {
  const { data: terms, isLoading } = useTermsOfUse()

  const termsComponent = useMemo(() => {
    if (!terms) return null

    return renderRichText(terms)
  }, [terms])

  const renderFooter = (): React.ReactNode => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={onAgreeAndContinue}
        disabled={isLoading}>
        Agree and continue
      </Button>
    )
  }

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title="Terms and conditions"
      contentContainerStyle={{
        flexGrow: 1,
        paddingLeft: 16,
        paddingRight: 16,
        width: SCREEN_WIDTH
      }}
      renderFooter={renderFooter}>
      {isLoading ? <Loader /> : <View sx={{ gap: 12 }}>{termsComponent}</View>}
    </ScrollScreen>
  )
}
