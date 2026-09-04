// dashboard/components/AuditTable.jsx

function StatusBadge({ status }) {
  const cls =
    status === 'success' ? 'badge-success' : status === 'failed' ? 'badge-failed' : 'badge-skipped';
  return <span className={`badge ${cls}`}>{status || 'n/a'}</span>;
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function AuditTable({ rows }) {
  return (
    <div className="panel">
      <h2>Audit trail</h2>
      {(!rows || rows.length === 0) ? (
        <div className="empty-state">
          No audit records yet. Run <code>node scripts/run_pipeline.js</code> to populate this.
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Diagnosis</th>
                <th>Confidence</th>
                <th>Action</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.session_id}</td>
                  <td>{row.customer_id}</td>
                  <td>{row.amount != null ? `₹${row.amount}` : '—'}</td>
                  <td>{row.diagnosis}</td>
                  <td>{row.confidence != null ? `${Math.round(row.confidence * 100)}%` : '—'}</td>
                  <td>{row.action_taken}</td>
                  <td><StatusBadge status={row.action_status} /></td>
                  <td>{formatTime(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}