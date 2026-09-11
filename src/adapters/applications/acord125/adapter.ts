import type { ApplicationRecord, MappingRow } from '../../../domain/types'

export const buildAcord125Preview = (application: ApplicationRecord) => {
  const rows: MappingRow[] = [
    {
      acordField: 'Applicant Legal Name',
      canonicalField: 'business.legalName',
      value: application.profile.business.legalName,
      status: 'mapped',
      note: 'Canonical business profile -> ACORD 125 named insured.',
    },
    {
      acordField: 'Entity Type',
      canonicalField: 'business.entityType',
      value: application.profile.business.entityType,
      status: 'mapped',
      note: 'Domain model remains ACORD-independent until adapter mapping.',
    },
    {
      acordField: 'Annual Revenue',
      canonicalField: 'business.annualRevenue',
      value: `$${application.profile.business.annualRevenue.toLocaleString()}`,
      status: application.conflicts.some((conflict) => conflict.status !== 'resolved') ? 'review_required' : 'mapped',
      note: application.conflicts.some((conflict) => conflict.status !== 'resolved')
        ? 'Conflicting customer and document values preserved for broker review.'
        : 'Resolved revenue selected by broker workflow.',
    },
    {
      acordField: 'NAICS',
      canonicalField: 'business.naicsCode',
      value: application.profile.business.naicsCode,
      status: 'mapped',
      note: 'Existing profile / prior ACORD source.',
    },
    {
      acordField: 'Number of Employees',
      canonicalField: 'business.employeeCount',
      value: String(application.profile.business.employeeCount),
      status: 'mapped',
      note: 'Document-extracted and carried into canonical profile.',
    },
    {
      acordField: 'Years in Business',
      canonicalField: 'business.yearsInBusiness',
      value: application.profile.business.yearsInBusiness ? String(application.profile.business.yearsInBusiness) : 'Missing',
      status: application.profile.business.yearsInBusiness ? 'mapped' : 'missing',
      note: 'Requested only if missing from uploaded documents.',
    },
    {
      acordField: 'FEIN',
      canonicalField: 'business.fein',
      value: application.profile.business.fein ?? 'Missing',
      status: application.profile.business.fein ? 'mapped' : 'missing',
      note: 'Stored separately from ACORD field identifiers for future reuse.',
    },
    {
      acordField: 'Desired Effective Date',
      canonicalField: 'currentInsurance.effectiveDate',
      value: application.profile.currentInsurance.effectiveDate ?? 'Missing',
      status: application.profile.currentInsurance.effectiveDate ? 'mapped' : 'missing',
      note: 'Captured through smart wizard because the policy PDF omitted it.',
    },
  ]

  return {
    status: application.generatedAt ? 'Generated' : 'Ready for preview',
    mappedCount: 43,
    missingCount: 2,
    reviewRequiredCount: 2,
    rows,
    generatedPreview: application.generatedAt
      ? `ACORD 125 generated for ${application.profile.business.legalName} on ${new Date(application.generatedAt).toLocaleString()}.`
      : 'Generate Application to simulate PDF output packaging.',
  }
}
