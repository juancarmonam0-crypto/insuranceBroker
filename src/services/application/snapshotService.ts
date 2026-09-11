import type {
  AcordPreview,
  ApplicationRecord,
  ApplicationSnapshotPayload,
  ApplicationSnapshotRecord,
  ReadinessResult,
} from '../../domain/types'

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    return `{${Object.keys(objectValue).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`).join(',')}}`
  }

  return JSON.stringify(value)
}

export const hashSnapshotPayload = (payload: ApplicationSnapshotPayload) => {
  const serialized = stableStringify(payload)
  let hash = 2166136261

  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export const createApplicationSnapshot = (
  application: ApplicationRecord,
  readiness: ReadinessResult,
  acordPreview: AcordPreview,
  createdBy = 'broker-demo-user',
) => {
  const createdAt = application.generatedAt ?? new Date().toISOString()
  const payload: ApplicationSnapshotPayload = {
    applicationId: application.id,
    agencyId: application.agency_id,
    customerId: application.customerId,
    definitionId: application.definitionId,
    definitionVersion: application.definitionVersion,
    lineOfBusiness: application.lineOfBusiness,
    status: application.status,
    completion: application.completion,
    fieldStates: structuredClone(application.fieldStates),
    customerConfirmed: application.customerConfirmed,
    brokerVerified: application.brokerVerified,
    profile: structuredClone(application.profile),
    provenance: structuredClone(application.profile.fieldProvenance),
    conflicts: structuredClone(application.conflicts),
    readiness: structuredClone(readiness),
    mappingResult: {
      mappedCount: acordPreview.mappedCount,
      missingCount: acordPreview.missingCount,
      reviewRequiredCount: acordPreview.reviewRequiredCount,
      rows: structuredClone(acordPreview.rows),
    },
    generatedAt: application.generatedAt,
    createdAt,
  }

  return {
    id: `snapshot-${application.id}-${createdAt}`,
    agency_id: application.agency_id,
    application_id: application.id,
    applicationDefinitionId: application.definitionId,
    applicationDefinitionVersion: application.definitionVersion,
    snapshotHash: hashSnapshotPayload(payload),
    createdAt,
    createdBy,
    snapshot: payload,
  } satisfies ApplicationSnapshotRecord
}
