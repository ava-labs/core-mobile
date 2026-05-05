import { Button, SCREEN_WIDTH, View } from '@avalabs/k2-alpine'
import { Loader } from 'common/components/Loader'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { renderRichText } from 'common/utils/renderRichText'
import { useTermsOfUse } from 'features/onboarding/hooks/useTermsOfUse'
import React, { useMemo } from 'react'

export const TermsAndConditions = ({
  onAgreeAndContinue,
  wizardStep
}: {
  onAgreeAndContinue: () => void
  // When provided, renders the Hello UI wizard footer (progress dots +
  // forward FAB) instead of the legacy "Agree and continue" pill. The
  // calling route is expected to pass this in limited mode only.
  wizardStep?: { currentStep: number; totalSteps: number }
}): JSX.Element => {
  const { data: terms, isLoading } = useTermsOfUse()

  const termsComponent = useMemo(() => {
    if (!terms) return null

    return renderRichText(terms)
  }, [terms])

  const renderFooter = (): React.ReactNode => {
    if (wizardStep) {
      return (
        <OnboardingWizardFooter
          currentStep={wizardStep.currentStep}
          totalSteps={wizardStep.totalSteps}
          onNext={onAgreeAndContinue}
          disabled={isLoading || !terms}
          testID={
            isLoading ? 'agreeAndContinueBtnDisabled' : 'agreeAndContinueBtn'
          }
        />
      )
    }
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
