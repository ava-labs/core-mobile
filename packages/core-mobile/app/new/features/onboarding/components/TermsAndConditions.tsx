import { Button, SCREEN_WIDTH, View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { renderRichText } from 'common/utils/renderRichText'
import { useTermsOfUse } from 'features/onboarding/hooks/useTermsOfUse'
import React, { useMemo } from 'react'

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
        testID={
          isLoading ? 'agreeAndContinueBtnDisabled' : 'agreeAndContinueBtn'
        }
        size="large"
        type="primary"
        onPress={onAgreeAndContinue}
        disabled={isLoading || !terms}>
        Agree and continue
      </Button>
    )
  }

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title="Terms and conditions"
      disableHeaderSnap
      contentContainerStyle={{
        flexGrow: 1,
        paddingLeft: 16,
        paddingRight: 16,
        width: SCREEN_WIDTH
      }}
      renderFooter={renderFooter}>
      {isLoading || !terms ? (
        <Loader />
      ) : (
        <View sx={{ gap: 12 }}>{termsComponent}</View>
      )}
    </ScrollScreen>
  )
}
