import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoApplication } from '../data/mock/insurly'
import type { ApplicationRecord } from '../domain/types'
import { buildAcord125Preview } from '../adapters/applications/acord125/adapter'
import { getApplicationDefinition } from '../domain/applicationDefinitions'
import {
  answerRequirement,
  applyCustomerReviewChange,
  confirmCustomerReview,
  markGenerated,
  processDocumentIntake,
  recalculateApplication,
  resolveApplicationConflict,
  verifyApplication,
} from '../services/application/workflow'
import { calculateReadiness } from '../services/application/readinessEngine'
import { persistApplication, loadStoredApplication } from '../services/storage'
import { AppStateContext, type AppStateValue } from './AppStateContext'

const createSeedApplication = () => structuredClone(demoApplication)

const normalizeApplication = (application: ApplicationRecord) => recalculateApplication(application)

const buildInitialApplication = () => {
  const stored = loadStoredApplication()
  return normalizeApplication(stored ?? createSeedApplication())
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [application, setApplication] = useState<ApplicationRecord>(buildInitialApplication)

  useEffect(() => {
    persistApplication(application)
  }, [application])

  const readiness = useMemo(() => {
    const definition = getApplicationDefinition(application.definitionId, application.definitionVersion)
    return calculateReadiness(application, definition)
  }, [application])

  const value = useMemo<AppStateValue>(
    () => ({
      application,
      acordPreview: buildAcord125Preview(application),
      readiness,
      processDocuments: () => setApplication((current) => processDocumentIntake(current)),
      answerWizardQuestion: (field, value) => setApplication((current) => answerRequirement(current, field, value)),
      resetDemo: () => setApplication(normalizeApplication(createSeedApplication())),
      confirmCustomerReview: () => setApplication((current) => confirmCustomerReview(current)),
      confirmRevenueChange: () => setApplication((current) => applyCustomerReviewChange(current, 'business.annualRevenue', 150000)),
      resolveConflict: (conflictId, action, correctedValue) =>
        setApplication((current) => resolveApplicationConflict(current, conflictId, action, correctedValue)),
      markBrokerVerified: () => setApplication((current) => verifyApplication(current)),
      markGenerated: () => setApplication((current) => markGenerated(current)),
    }),
    [application, readiness],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
