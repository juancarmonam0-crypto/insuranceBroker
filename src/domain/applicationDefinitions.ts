import type { ApplicationDefinition } from './types'

export const commercialAcord125Definition: ApplicationDefinition = {
  id: 'commercial-acord125',
  lineOfBusiness: 'Commercial Insurance',
  version: 1,
  requirements: [
    {
      id: 'business-legal-name',
      canonicalField: 'business.legalName',
      label: 'Legal name',
      section: 'Business Information',
      inputType: 'text',
      required: true,
      material: true,
      requiresCustomerConfirmation: true,
      requiresBrokerVerification: false,
    },
    {
      id: 'business-annual-revenue',
      canonicalField: 'business.annualRevenue',
      label: 'Annual revenue',
      section: 'Business Information',
      inputType: 'currency',
      required: true,
      material: true,
      requiresCustomerConfirmation: true,
      requiresBrokerVerification: true,
      validation: { min: 0 },
    },
    {
      id: 'business-naics-code',
      canonicalField: 'business.naicsCode',
      label: 'NAICS code',
      section: 'Business Information',
      inputType: 'text',
      required: true,
      material: true,
      requiresCustomerConfirmation: false,
      requiresBrokerVerification: false,
    },
    {
      id: 'business-employee-count',
      canonicalField: 'business.employeeCount',
      label: 'Number of employees',
      section: 'Operations',
      inputType: 'number',
      required: true,
      material: true,
      requiresCustomerConfirmation: true,
      requiresBrokerVerification: false,
      validation: { min: 1 },
    },
    {
      id: 'business-years-in-business',
      canonicalField: 'business.yearsInBusiness',
      label: 'Years in business',
      section: 'Operations',
      inputType: 'number',
      required: true,
      material: false,
      requiresCustomerConfirmation: false,
      requiresBrokerVerification: false,
      validation: { min: 0 },
    },
    {
      id: 'business-fein',
      canonicalField: 'business.fein',
      label: 'FEIN',
      section: 'Business Information',
      inputType: 'text',
      required: true,
      material: true,
      requiresCustomerConfirmation: false,
      requiresBrokerVerification: true,
    },
    {
      id: 'current-insurance-effective-date',
      canonicalField: 'currentInsurance.effectiveDate',
      label: 'Desired effective date',
      section: 'Coverage',
      inputType: 'date',
      required: true,
      material: true,
      requiresCustomerConfirmation: true,
      requiresBrokerVerification: false,
    },
  ],
}

const definitions = [commercialAcord125Definition]

export const getApplicationDefinition = (definitionId: string, version: number) => {
  const definition = definitions.find((candidate) => candidate.id === definitionId && candidate.version === version)
  if (!definition) {
    throw new Error(`Unknown application definition: ${definitionId}@${version}`)
  }

  return definition
}
