import { Link } from 'react-router-dom'
import { SurfaceCard } from '../../components/SurfaceCard'
import { StatusBadge } from '../../components/StatusBadge'
import { brokerMetrics } from '../../data/mock/insurly'
import { useAppState } from '../../state/useAppState'

const brokerNav = ['Dashboard', 'Customers', 'Applications', 'Needs Review', 'Documents', 'Analytics', 'Settings']

export const BrokerDashboardPage = () => {
  const { application } = useAppState()

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
            <p className="muted">{application.lineOfBusiness} · {application.completion}% completion · {application.conflicts.length || 1} issue</p>
          </div>
          <div className="button-row">
            <StatusBadge status={application.conflicts.length > 0 ? 'broker_review' : application.status} />
            <Link className="button button--secondary" to="/broker/applications/nexo">Open application</Link>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

export const BrokerApplicationPage = () => {
  const { application, resolveConflict, markBrokerVerified } = useAppState()

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">Broker application workspace</p>
          <h1>{application.customerName}</h1>
          <p className="lede">Review issues, inspect provenance, verify customer confirmations, and decide when the account is ready.</p>
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
            <li><strong>Customer confirmations:</strong> {application.customerConfirmed ? 'Confirmed' : 'Pending'}</li>
          </ul>
        </SurfaceCard>
        <SurfaceCard title="Broker actions" eyebrow="Needs Review workflow">
          <div className="button-row button-row--wrap">
            <button className="button" type="button" onClick={() => resolveConflict('accept_customer')}>Accept Customer Value</button>
            <button className="button button--secondary" type="button" onClick={() => resolveConflict('request_clarification')}>Request Clarification</button>
            <button className="button button--secondary" type="button" onClick={() => resolveConflict('correct_value')}>Correct Value</button>
            <button className="button button--secondary" type="button" onClick={markBrokerVerified}>Mark Verified</button>
          </div>
          <p className="muted">AI never picks truth automatically; broker actions resolve the exception.</p>
        </SurfaceCard>
      </div>
      <SurfaceCard title="Conflict review" eyebrow="Document vs. customer evidence">
        {application.conflicts.length === 0 ? (
          <p className="muted">No unresolved conflicts. Application can progress to submission preparation.</p>
        ) : (
          <div className="stack-sm">
            <div className="application-row">
              <div>
                <strong>{application.conflicts[0]?.label}</strong>
                <p className="muted">{application.conflicts[0]?.message}</p>
              </div>
              <StatusBadge status={application.conflicts[0]?.status ?? 'open'} />
            </div>
            <div className="table-like">
              {application.conflicts[0]?.evidence.map((fact) => (
                <div className="table-like__row provenance-row" key={fact.id}>
                  <div><strong>{String(fact.value)}</strong><p className="muted">{fact.source_type}</p></div>
                  <div><strong>{fact.source_document ?? 'Customer review'}</strong><p className="muted">{fact.source_page ? `Page ${fact.source_page}` : 'No page reference'}</p></div>
                  <div><strong>{fact.customer_confirmed ? 'Confirmed' : 'Unconfirmed'}</strong><p className="muted">{fact.broker_verified ? 'Broker verified' : 'Awaiting broker decision'}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
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
      <SurfaceCard title="Field provenance" eyebrow="Canonical profile + verification state">
        <div className="table-like">
          {application.profile.fieldProvenance.map((fact) => (
            <div className="table-like__row provenance-row" key={fact.id}>
              <div><strong>{fact.label}</strong><p className="muted">{fact.canonical_field}</p></div>
              <div><strong>{String(fact.value)}</strong><p className="muted">{fact.source_type}</p></div>
              <div><strong>{fact.customer_confirmed ? 'Confirmed' : 'Pending'}</strong><p className="muted">{fact.broker_verified ? 'Verified' : 'Not verified'}</p></div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export const BrokerFormsPage = () => {
  const { acordPreview, markGenerated } = useAppState()

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">ACORD 125 forms</p>
          <h1>Preview mapping and simulate generation</h1>
          <p className="lede">ACORD-specific field identifiers remain isolated in the adapter layer.</p>
        </div>
        <div className="button-row">
          <button className="button button--secondary" type="button">Preview Mapping</button>
          <button className="button" type="button" onClick={markGenerated}>Generate Application</button>
        </div>
      </div>
      <SurfaceCard title="Adapter status">
        <div className="hero-stats">
          <div><strong>{acordPreview.mappedCount}/47</strong><span>mapped</span></div>
          <div><strong>{acordPreview.missingCount}</strong><span>missing</span></div>
          <div><strong>{acordPreview.reviewRequiredCount}</strong><span>review required</span></div>
        </div>
      </SurfaceCard>
      <SurfaceCard title="Sample mapping rows">
        <div className="table-like">
          {acordPreview.rows.map((row) => (
            <div className="table-like__row provenance-row" key={row.acordField}>
              <div><strong>{row.acordField}</strong><p className="muted">{row.canonicalField}</p></div>
              <div><strong>{row.value}</strong><p className="muted">{row.note}</p></div>
              <div><StatusBadge status={row.status === 'mapped' ? 'ready_to_submit' : row.status === 'missing' ? 'declined' : 'broker_review'} /></div>
            </div>
          ))}
        </div>
      </SurfaceCard>
      <SurfaceCard title="Simulated generated output">
        <p>{acordPreview.generatedPreview}</p>
      </SurfaceCard>
    </div>
  )
}
