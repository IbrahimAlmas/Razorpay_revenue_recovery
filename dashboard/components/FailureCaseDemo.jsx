// dashboard/components/FailureCaseDemo.jsx

function FailureCaseDemo({ rows }) {
  const [selectedId, setSelectedId] = React.useState(null);

  React.useEffect(() => {
    if (rows && rows.length > 0 && selectedId === null) {
      setSelectedId(rows[0].id);
    }
  }, [rows]);

  if (!rows || rows.length === 0) {
    return (
      <div className="panel">
        <h2>Failure case walkthrough</h2>
        <div className="empty-state">
          No cases to show yet. Run <code>node scripts/run_pipeline.js</code> first.
        </div>
      </div>
    );
  }

  const selected = rows.find((r) => r.id === Number(selectedId)) || rows[0];

  return (
    <div className="panel">
      <h2>Failure case walkthrough</h2>

      <select
        className="case-select"
        value={selected.id}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {rows.map((r) => (
          <option key={r.id} value={r.id}>
            {r.session_id} — {r.diagnosis} → {r.action_taken}
          </option>
        ))}
      </select>

      <div className="case-flow">
        <div className="case-step">
          <h4>1. Event</h4>
          <p><span className="k">Session:</span> {selected.session_id}</p>
          <p><span className="k">Customer:</span> {selected.customer_id}</p>
          <p><span className="k">Type:</span> {selected.event_type}</p>
          <p><span className="k">Amount:</span> ₹{selected.amount}</p>
          <p><span className="k">Attempt:</span> #{selected.attempt_number}</p>
        </div>

        <div className="case-step">
          <h4>2. Diagnosis (Grok)</h4>
          <p><span className="k">Diagnosis:</span> {selected.diagnosis}</p>
          <p><span className="k">Confidence:</span> {selected.confidence != null ? `${Math.round(selected.confidence * 100)}%` : '—'}</p>
          <p><span className="k">Reasoning:</span> {selected.reasoning}</p>
        </div>

        <div className="case-step">
          <h4>3. Recommended action</h4>
          <p><span className="k">Recommended:</span> {selected.recommended_action}</p>
          <p><span className="k">Final action:</span> {selected.action_taken}</p>
          {selected.recommended_action !== selected.action_taken && (
            <p style={{ color: 'var(--warn)' }}>⚠ Guardrails overrode the model's recommendation</p>
          )}
        </div>

        <div className="case-step">
          <h4>4. Outcome</h4>
          <p><span className="k">Status:</span> {selected.action_status}</p>
          <p><span className="k">Detail:</span> {selected.action_detail}</p>
          <p><span className="k">Logged at:</span> {selected.created_at}</p>
        </div>
      </div>
    </div>
  );
}