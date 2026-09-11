import { describe, expect, test } from 'vitest'
import { createLocalStoragePersistence } from './localStoragePersistence'
import { demoApplication, demoCustomer } from '../../data/mock/insurly'
import type { ApplicationWorkspace } from './types'
import { createApplicationSnapshot } from '../../services/application/snapshotService'
import { buildAcord125Preview } from '../applications/acord125/adapter'
import { calculateReadiness } from '../../services/application/readinessEngine'
import { getApplicationDefinition } from '../../domain/applicationDefinitions'
import { recalculateApplication } from '../../services/application/workflow'

class MemoryStorage {
  private readonly store = new Map<string, string>()

  getItem(key: string) {
    return this.store.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
}

const createWorkspace = (): ApplicationWorkspace => ({
  customer: structuredClone(demoCustomer),
  application: recalculateApplication(structuredClone(demoApplication)),
  snapshots: [],
})

const createReadySnapshot = (workspace: ApplicationWorkspace) => {
  const definition = getApplicationDefinition(workspace.application.definitionId, workspace.application.definitionVersion)
  const readiness = calculateReadiness(workspace.application, definition)
  return createApplicationSnapshot(workspace.application, readiness, buildAcord125Preview(workspace.application))
}

describe('local persistence adapter', () => {
  test('tenant A records cannot be mixed with tenant B records at the adapter boundary', async () => {
    const adapter = createLocalStoragePersistence(new MemoryStorage())
    const tenantA = createWorkspace()
    const tenantB = createWorkspace()
    tenantB.customer.id = 'customer-tenant-b'
    tenantB.customer.agency_id = 'agency-tenant-b'
    tenantB.customer.displayName = 'Tenant B Manufacturing'
    tenantB.application.id = 'app-tenant-b'
    tenantB.application.agency_id = 'agency-tenant-b'
    tenantB.application.customerId = 'customer-tenant-b'
    tenantB.application.customerName = 'Tenant B Manufacturing'
    tenantB.application.profile.customer_id = 'customer-tenant-b'
    tenantB.application.profile.application_id = 'app-tenant-b'
    tenantB.application.profile.agency_id = 'agency-tenant-b'
    tenantB.application.fieldStates = tenantB.application.fieldStates.map((item) => ({ ...item }))

    await adapter.saveCustomer(tenantA.customer)
    await adapter.saveApplication(tenantA.application)
    await adapter.saveFieldStates(tenantA.application.agency_id, tenantA.application.id, tenantA.application.fieldStates)
    await adapter.appendProvenance(tenantA.application.agency_id, tenantA.application.id, tenantA.application.profile.fieldProvenance)
    await adapter.saveConflicts(tenantA.application.agency_id, tenantA.application.id, tenantA.application.conflicts)

    await adapter.saveCustomer(tenantB.customer)
    await adapter.saveApplication(tenantB.application)
    await adapter.saveFieldStates(tenantB.application.agency_id, tenantB.application.id, tenantB.application.fieldStates)
    await adapter.appendProvenance(tenantB.application.agency_id, tenantB.application.id, tenantB.application.profile.fieldProvenance)
    await adapter.saveConflicts(tenantB.application.agency_id, tenantB.application.id, tenantB.application.conflicts)

    const loadedA = await adapter.loadWorkspace({
      agencyId: tenantA.application.agency_id,
      applicationId: tenantA.application.id,
      customerId: tenantA.customer.id,
      fallbackWorkspace: tenantA,
    })

    expect(loadedA.customer.displayName).toBe('Nexo Rental Solutions LLC')
    expect(loadedA.application.id).toBe('app-nexo-rental-solutions')
    expect(loadedA.application.agency_id).toBe('agency-insurly-demo')
  })

  test('localStorage adapter contract can be exercised independently of the workflow engine', async () => {
    const adapter = createLocalStoragePersistence(new MemoryStorage())
    const workspace = createWorkspace()

    await adapter.saveCustomer(workspace.customer)
    await adapter.saveApplication(workspace.application)
    await adapter.saveFieldStates(workspace.application.agency_id, workspace.application.id, workspace.application.fieldStates)
    await adapter.appendProvenance(workspace.application.agency_id, workspace.application.id, workspace.application.profile.fieldProvenance)
    await adapter.saveConflicts(workspace.application.agency_id, workspace.application.id, workspace.application.conflicts)

    const loaded = await adapter.loadWorkspace({
      agencyId: workspace.application.agency_id,
      applicationId: workspace.application.id,
      customerId: workspace.customer.id,
      fallbackWorkspace: workspace,
    })

    expect(loaded.application.definitionId).toBe(workspace.application.definitionId)
    expect(loaded.application.definitionVersion).toBe(workspace.application.definitionVersion)
    expect(loaded.customer.id).toBe(workspace.customer.id)
  })

  test('second generation creates a second snapshot rather than overwriting the first', async () => {
    const adapter = createLocalStoragePersistence(new MemoryStorage())
    const workspace = createWorkspace()
    const first = createReadySnapshot(workspace)
    const second = createReadySnapshot({
      ...workspace,
      application: {
        ...workspace.application,
        generatedAt: '2026-09-11T06:00:00.000Z',
      },
    })

    await adapter.createSnapshot(first)
    await adapter.createSnapshot(second)

    const snapshots = await adapter.listSnapshots(workspace.application.agency_id, workspace.application.id)

    expect(snapshots).toHaveLength(2)
    expect(snapshots[0]?.id).not.toBe(snapshots[1]?.id)
  })

  test('loadSnapshot returns immutable snapshot data', async () => {
    const adapter = createLocalStoragePersistence(new MemoryStorage())
    const workspace = createWorkspace()
    const snapshot = createReadySnapshot(workspace)

    await adapter.createSnapshot(snapshot)
    const loaded = await adapter.loadSnapshot(workspace.application.agency_id, snapshot.id)

    expect(loaded?.snapshotHash).toBe(snapshot.snapshotHash)
    expect(loaded?.snapshot.definitionVersion).toBe(workspace.application.definitionVersion)
  })
})
