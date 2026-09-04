// dashboard/components/SummaryStats.jsx

function BreakdownBars({ rows, labelKey, countKey, max }) {
  if (!rows || rows.length === 0) {
    return <div className="empty-state">No data yet</div>;
  }
  return rows.map((row) => {
    const label = row[labelKey] ?? 'unknown';
    const count = row[countKey] ?? 0;
    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
    return (
      <div className="bar-row" key={label}>
        <div className="bar-label" title={label}>{label}</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="bar-count">{count}</div>
      </div>
    );
  });
}

function SummaryStats({ summary }) {
  if (!summary) {
    return <div className="panel"><div className="loading">Loading summary…</div></div>;
  }

  const maxDiagnosis = Math.max(0, ...summary.byDiagnosis.map((r) => r.count));
  const maxAction = Math.max(0, ...summary.byAction.map((r) => r.count));

  const successCount = summary.byStatus.find((s) => s.action_status === 'success')?.count ?? 0;
  const successRate = summary.total > 0 ? Math.round((successCount / summary.total) * 100) : 0;

  return (
    <div className="panel">
      <h2>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{summary.total}</div>
          <div className="label">Events processed</div>
        </div>
        <div className="stat-card">
          <div className="value">{(summary.avgConfidence * 100).toFixed(0)}%</div>
          <div className="label">Avg. diagnosis confidence</div>
        </div>
        <div className="stat-card">
          <div className="value">{successRate}%</div>
          <div className="label">Action success rate</div>
        </div>
      </div>

      <div className="breakdown-row">
        <div className="breakdown-col">
          <h3>By diagnosis</h3>
          <BreakdownBars rows={summary.byDiagnosis} labelKey="diagnosis" countKey="count" max={maxDiagnosis} />
        </div>
        <div className="breakdown-col">
          <h3>By action taken</h3>
          <BreakdownBars rows={summary.byAction} labelKey="action_taken" countKey="count" max={maxAction} />
        </div>
      </div>
    </div>
  );
}