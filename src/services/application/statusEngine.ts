import type { ApplicationDefinition, ApplicationRecord, ApplicationStatus, ReadinessResult } from '../../domain/types'
import { getApplicableRequirements } from './requirementsEngine'

export const deriveApplicationStatus = (
  application: ApplicationRecord,
  definition: ApplicationDefinition,
  readiness: ReadinessResult,
): ApplicationStatus => {
  if (readiness.ready) return 'ready_to_submit'
  if (readiness.unresolvedConflicts.length > 0) return 'broker_review'
  if (readiness.missingRequirements.length === 0 && readiness.missingConfirmations.length > 0) return 'customer_review'
  if (readiness.missingBrokerVerifications.length > 0) return 'broker_review'
  if (readiness.missingRequirements.length === 0) return 'customer_review'

  const satisfiedCount = getApplicableRequirements(application, definition).filter((evaluation) => evaluation.satisfied).length
  return satisfiedCount === 0 ? 'draft' : 'collecting_information'
}
