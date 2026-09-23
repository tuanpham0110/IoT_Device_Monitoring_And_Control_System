export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="mono muted small">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tip-row">
          <span className="swatch" style={{ background: p.color }} />
          {p.name}: <strong className="mono">{p.value}</strong>
        </div>
      ))}
    </div>
  );
}
