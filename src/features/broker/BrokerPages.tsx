import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SurfaceCard } from '../../components/SurfaceCard'
import { StatusBadge } from '../../components/StatusBadge'
import { brokerMetrics } from '../../data/mock/insurly'
import { useAppState } from '../../state/useAppState'

const brokerNav = ['Dashboard', 'Customers', 'Applications', 'Needs Review', 'Documents', 'Analytics', 'Settings']

export const BrokerDashboardPage = () => {
  const { application, readiness } = useAppState()

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Broker portal</p>
          <h1>Operational dashboard</h1>
          <p className="lede">Desktop-first navigation with mobile-friendly cards for actionable submission readiness.</p>
        </div>
        <div className="pill-row">{brokerNav.map((item) => <span key={item} className="pill">{item}</span>)}</div>
      </div>
      <div className="grid metrics-grid">
        {brokerMetrics.map((metric) => (
          <SurfaceCard key={metric.label} title={metric.label}>
            <div className="metric-value">{metric.count}</div>
          </SurfaceCard>
        ))}
      </div>
      <SurfaceCard title="Applications needing attention" eyebrow="Needs review queue">
        <div className="application-row">
          <div>
            <strong>{application.customerName}</strong>
            <p className="muted">{application.lineOfBusiness} · {application.completion}% completion · {readiness.blockers.length} blocker{readiness.blockers.length === 1 ? '' : 's'}</p>
          </div>
          <div className="button-row">
            <StatusBadge status={application.status} />
            <Link className="button button--secondary" to="/broker/applications/nexo">Open application</Link>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

export const BrokerApplicationPage = () => {
  const { application, readiness, resolveConflict, markBrokerVerified } = useAppState()
  const [correctedRevenue, setCorrectedRevenue] = useState('')
  const activeConflict = application.conflicts[0]

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Broker application workspace</p>
          <h1>{application.customerName}</h1>
          <p className="lede">Review issues, inspect provenance, verify required fields, and decide when the account is ready.</p>
        </div>
        <div className="button-row">
          <StatusBadge status={application.status} />
          <Link className="button" to="/broker/applications/nexo/forms">Open forms</Link>
        </div>
      </div>
      <div className="grid two-up">
        <SurfaceCard title="Application summary">
          <ul className="list-clean">
            <li><strong>Customer:</strong> {application.customerName}</li>
            <li><strong>Status:</strong> <StatusBadge status={application.status} /></li>
            <li><strong>Completion:</strong> {application.completion}%</li>
            <li><strong>Missing information:</strong> {application.missingFields.length}</li>
            <li><strong>Customer confirmations:</strong> {application.customerConfirmed ? 'Satisfied' : 'Pending'}</li>
            <li><strong>Broker verification:</strong> {application.brokerVerified ? 'Satisfied' : 'Pending'}</li>
          </ul>
        </SurfaceCard>
        <SurfaceCard title="Readiness blockers" eyebrow="Authoritative readiness engine">
          {readiness.blockers.length === 0 ? (
            <p className="muted">No blockers remain. The application is ready to submit.</p>
          ) : (
            <ul className="list-clean list-clean--spaced">
              {readiness.blockers.map((blocker) => (
                <li key={`${blocker.type}-${blocker.canonicalField ?? blocker.message}`}>{blocker.message}</li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </div>
      <SurfaceCard title="Broker actions" eyebrow="Needs Review workflow">
        <div className="button-row button-row--wrap">
          {activeConflict ? (
            <>
              <button className="button" type="button" onClick={() => resolveConflict(activeConflict.id, 'accept_customer')}>Accept Customer Value</button>
              <button className="button button--secondary" type="button" onClick={() => resolveConflict(activeConflict.id, 'use_evidence')}>Use Evidence</button>
              <button className="button button--secondary" type="button" onClick={() => resolveConflict(activeConflict.id, 'request_clarification')}>Request Clarification</button>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="Corrected revenue"
                value={correctedRevenue}
                onChange={(event) => setCorrectedRevenue(event.target.value)}
              />
              <button
                className="button button--secondary"
                type="button"
                onClick={() => {
                  const parsed = Number(correctedRevenue)
                  if (!Number.isNaN(parsed) && correctedRevenue !== '') {
                    resolveConflict(activeConflict.id, 'correct_value', parsed)
                    setCorrectedRevenue('')
                  }
                }}
              >
                Correct Value
              </button>
            </>
          ) : null}
          <button className="button button--secondary" type="button" onClick={markBrokerVerified}>Verify Application</button>
        </div>
        <p className="muted">AI never picks truth automatically; broker actions resolve exceptions and verification gates readiness.</p>
      </SurfaceCard>
      <SurfaceCard title="Conflict review" eyebrow="Document vs. customer evidence">
        {application.conflicts.length === 0 ? (
          <p className="muted">No unresolved conflicts. Application can progress to submission preparation.</p>
        ) : (
          <div className="stack-sm">
            {application.conflicts.map((conflict) => (
              <div className="stack-sm" key={conflict.id}>
                <div className="application-row">
                  <div>
                    <strong>{conflict.label}</strong>
                    <p className="muted">{conflict.message}</p>
                  </div>
                  <StatusBadge status={conflict.status} />
                </div>
                <div className="table-like">
                  {conflict.evidence.map((fact) => (
                    <div className="table-like__row provenance-row" key={fact.id}>
                      <div><strong>{String(fact.value)}</strong><p className="muted">{fact.sourceType}</p></div>
                      <div><strong>{fact.sourceDocument ?? 'Customer review'}</strong><p className="muted">{fact.sourcePage ? `Page ${fact.sourcePage}` : 'No page reference'}</p></div>
                      <div><strong>{fact.customerConfirmed ? 'Confirmed' : 'Unconfirmed'}</strong><p className="muted">{fact.brokerVerified ? 'Broker verified' : 'Awaiting broker decision'}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
      <SurfaceCard title="Field provenance" eyebrow="Selected field state vs. evidence history">
        <div className="table-like">
          {application.fieldStates.map((fieldState) => (
            <div className="table-like__row provenance-row" key={fieldState.canonicalField}>
              <div><strong>{fieldState.canonicalField}</strong><p className="muted">Selected source {fieldState.selectedEvidenceId ?? 'Manual'}</p></div>
              <div><strong>{String(fieldState.selectedValue ?? 'Missing')}</strong><p className="muted">Current application value</p></div>
              <div><strong>{fieldState.customerConfirmed ? 'Confirmed' : 'Pending'}</strong><p className="muted">{fieldState.brokerVerified ? 'Verified' : 'Not verified'}</p></div>
            </div>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard title="Documents" eyebrow="Broker review queue">
        <div className="table-like">
          {application.profile.documents.map((document) => (
            <div className="table-like__row" key={document.id}>
              <div><strong>{document.type}</strong><p className="muted">{document.fileName}</p></div>
              <div><StatusBadge status={document.status} /></div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export const BrokerFormsPage = () => {
  const { acordPreview, markGenerated, application } = useAppState()

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">ACORD 125 forms</p>
          <h1>Preview mapping and generate the application representation</h1>
          <p className="lede">ACORD-specific target fields remain isolated in the adapter layer.</p>
        </div>
        <div className="button-row">
          <button className="button button--secondary" type="button">Preview Mapping</button>
          <button className="button" type="button" onClick={markGenerated}>Generate Application</button>
        </div>
      </div>
      <SurfaceCard title="Adapter status">
        <div className="hero-stats">
          <div><strong>{acordPreview.mappedCount}/{acordPreview.rows.length}</strong><span>mapped</span></div>
          <div><strong>{acordPreview.missingCount}</strong><span>missing</span></div>
          <div><strong>{acordPreview.reviewRequiredCount}</strong><span>review required</span></div>
        </div>
        <p className="muted">Generate refreshes mapping metadata only. Status remains {application.status.replaceAll('_', ' ')}.</p>
      </SurfaceCard>
      <SurfaceCard title="Sample mapping rows">
        <div className="table-like">
          {acordPreview.rows.map((row) => (
            <div className="table-like__row provenance-row" key={`${row.acordField}-${row.canonicalField}`}>
              <div><strong>{row.acordField}</strong><p className="muted">{row.canonicalField}</p></div>
              <div><strong>{row.value}</strong><p className="muted">{row.note}</p></div>
              <div><StatusBadge status={row.status === 'mapped' ? 'ready_to_submit' : row.status === 'missing' ? 'declined' : 'broker_review'} /></div>
            </div>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard title="Generated output metadata">
        <p>{acordPreview.generatedPreview}</p>
      </SurfaceCard>
    </div>
  )
}
